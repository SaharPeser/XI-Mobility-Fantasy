import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "fs";

// מריץ את כל קבצי ה-migrations על Postgres בזיכרון (PGlite) ובודק הרשאות, דדליינים וניקוד
const dir = new URL("../migrations/", import.meta.url);
const migration = readdirSync(dir)
  .sort()
  .map((f) => readFileSync(new URL(f, dir), "utf8"))
  .join("\n");
const db = new PGlite();

const U1 = "00000000-0000-0000-0000-000000000001"; // admin
const U2 = "00000000-0000-0000-0000-000000000002";
const U3 = "00000000-0000-0000-0000-000000000003";

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) failures++;
};

// סביבת Supabase מינימלית
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`);
await db.exec(migration);
console.log("migration applied");

async function as(uid, sql, params) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false);`);
  await db.exec(uid ? "set role authenticated" : "set role anon");
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec("reset role");
  }
}
async function fails(uid, sql, params) {
  try {
    const r = await as(uid, sql, params);
    return r.affectedRows === 0 && /^\s*(update|delete)/i.test(sql) ? "noop" : false;
  } catch (e) {
    return e.message;
  }
}

await db.exec(`
  insert into auth.users values
   ('${U1}', 'admin@x.com', '{"display_name":"מנהל"}'),
   ('${U2}', 'b@x.com', '{"display_name":"דני"}'),
   ('${U3}', 'c@x.com', '{}');
  update public.profiles set is_admin = true where id = '${U1}';
`);
const profs = await db.query("select display_name from profiles order by id");
ok(profs.rows.map((r) => r.display_name).join(",") === "מנהל,דני,c_0000", "profiles created by trigger");

// valid scores
const scores = await db.query(`select
  is_valid_set_score(21,19) a, is_valid_set_score(21,20) b, is_valid_set_score(22,20) c, is_valid_set_score(25,24) d,
  is_valid_set_score(25,23) e, is_valid_set_score(26,24) f, is_valid_set_score(23,20) g, is_valid_set_score(0,21) h`);
ok(JSON.stringify(Object.values(scores.rows[0])) === "[true,false,true,true,true,false,false,true]", "score rules");

// admin setup
const season = (await as(U1, `insert into seasons (name, is_active, table_deadline) values ('2026', true, now() + interval '1 day') returning id`)).rows[0].id;
for (let i = 1; i <= 12; i++) await as(U1, `insert into teams (season_id, name) values ($1, $2)`, [season, `קבוצה ${i}`]);
const teams = (await db.query(`select id, name from teams order by name`)).rows;
const tid = (n) => teams.find((t) => t.name === `קבוצה ${n}`).id;
for (let i = 1; i <= 12; i++) await as(U1, `insert into players (team_id, name) values ($1, $2), ($1, $3)`, [tid(i), `שחקן ${i}א`, `שחקן ${i}ב`]);
const players = (await db.query(`select id, name from players order by name`)).rows;
const pid = (n) => players.find((p) => p.name === n).id;
const round = (await as(U1, `insert into rounds (season_id, number, deadline) values ($1, 1, now() + interval '1 hour') returning id`, [season])).rows[0].id;
const match = (await as(U1, `insert into matches (round_id, home_team_id, away_team_id) values ($1, $2, $3) returning id`, [round, tid(1), tid(2)])).rows[0].id;
const match2 = (await as(U1, `insert into matches (round_id, home_team_id, away_team_id) values ($1, $2, $3) returning id`, [round, tid(3), tid(4)])).rows[0].id;
ok(true, "admin created season/teams/players/round/matches");

// permissions
ok(!!(await fails(U2, `insert into teams (season_id, name) values ($1, 'hack')`, [season])), "non-admin cannot create team");
ok(!!(await fails(U2, `update profiles set is_admin = true where id = $1`, [U2])), "user cannot make self admin");
ok(!(await fails(U2, `update profiles set display_name = 'דני2' where id = $1`, [U2])), "user can rename self");
ok(!!(await fails(null, `insert into match_predictions (user_id, match_id, home_score, away_score) values ($1,$2,21,15)`, [U2, match])), "anon cannot predict");

// predictions
await as(U2, `insert into match_predictions (user_id, match_id, home_score, away_score) values ($1,$2,21,15)`, [U2, match]);
await as(U2, `insert into match_predictions (user_id, match_id, home_score, away_score) values ($1,$2,19,21)`, [U2, match2]);
await as(U3, `insert into match_predictions (user_id, match_id, home_score, away_score) values ($1,$2,21,17)`, [U3, match]);
ok(!!(await fails(U2, `update match_predictions set home_score = 21, away_score = 20 where match_id = $1`, [match])), "invalid score rejected");
ok(!!(await fails(U2, `insert into match_predictions (user_id, match_id, home_score, away_score) values ($1,$2,21,15)`, [U3, match2])), "cannot predict for another user");
ok((await as(U3, `select * from match_predictions where user_id = $1`, [U2])).rows.length === 0, "others' predictions hidden before deadline");

// quad
const q = [pid("שחקן 1א"), pid("שחקן 2א"), pid("שחקן 3א"), pid("שחקן 4א")];
ok(!!(await fails(U2, `select save_quad($1, $2, $3)`, [round, q.slice(0, 3), q[0]])), "quad needs 4 players");
ok(!!(await fails(U2, `select save_quad($1, $2, $3)`, [round, q, pid("שחקן 5א")])), "captain must be in quad");
await as(U2, `select save_quad($1, $2, $3)`, [round, q, q[0]]);
await as(U2, `select save_quad($1, $2, $3)`, [round, q, q[1]]); // re-save with new captain
const qp = (await as(U2, `select player_id, is_captain from quad_picks where user_id = $1`, [U2])).rows;
ok(qp.length === 4 && qp.filter((r) => r.is_captain).length === 1 && qp.find((r) => r.is_captain).player_id === q[1], "quad saved, captain updated");

// table prediction: U2 exact order 1..12, U3 reversed
await as(U2, `select save_table_prediction($1, $2)`, [season, Array.from({ length: 12 }, (_, i) => tid(i + 1))]);
await as(U3, `select save_table_prediction($1, $2)`, [season, Array.from({ length: 12 }, (_, i) => tid(12 - i))]);
ok(!!(await fails(U2, `select save_table_prediction($1, $2)`, [season, [tid(1), tid(2)]])), "table needs all teams");

// leagues
const league = (await as(U2, `insert into leagues (name, owner_id) values ('החבר׳ה', $1) returning id, invite_code`, [U2])).rows[0];
await as(U3, `select join_league($1)`, [league.invite_code.toLowerCase()]);
ok((await as(U3, `select * from league_members where league_id = $1`, [league.id])).rows.length === 2, "join by code works");
ok((await as(U1, `select * from leagues where id = $1`, [league.id])).rows.length === 0, "non-member cannot see league");
ok(!!(await fails(U3, `select join_league('ZZZZZZ')`)), "bad code rejected");

// lock round, set results
await db.exec(`update rounds set deadline = now() - interval '1 minute'; update seasons set table_deadline = now() - interval '1 minute';`);
ok(!!(await fails(U2, `update match_predictions set home_score = 21, away_score = 10 where match_id = $1 and user_id = $2`, [match, U2])), "locked round cannot be edited");
ok(!!(await fails(U2, `select save_quad($1, $2, $3)`, [round, q, q[0]])), "locked quad cannot be edited");
ok((await as(U3, `select * from match_predictions where user_id = $1`, [U2])).rows.length === 2, "others' predictions visible after deadline");

await as(U1, `update matches set home_score = 21, away_score = 15 where id = $1`, [match]); // U2 exact (5), U3 winner (2)
await as(U1, `update matches set home_score = 25, away_score = 23 where id = $1`, [match2]); // U2 wrong (0)
ok(!!(await fails(U1, `update matches set home_score = 30, away_score = 28 where id = $1`, [match2])), "invalid result rejected");
await as(U1, `insert into player_round_points (player_id, round_id, points) values ($1,$5,10),($2,$5,5),($3,$5,1),($4,$5,0)`, [...q, round]);
// quad U2: captain q[1]=5*4=20; others (10+1+0)*2=22 => 42
for (let i = 1; i <= 12; i++) await as(U1, `update teams set final_position = $1 where id = $2`, [i === 1 ? 2 : i === 2 ? 1 : i, tid(i)]);
// U2 table: positions 3..12 correct = 10 * 3 = 30 ; U3 reversed: none correct -> 0

const lb = (await as(null, `select * from get_leaderboard($1)`, [season])).rows;
console.table(lb.map((r) => ({ name: r.display_name, m: +r.match_points, t: +r.table_points, q: +r.quad_points, total: +r.total, rank: +r.rank })));
const d = lb.find((r) => r.user_id === U2);
ok(+d.match_points === 5 && +d.table_points === 30 && +d.quad_points === 42 && +d.total === 77 && +d.rank === 1, "U2 scoring correct (5+30+42=77)");
const c = lb.find((r) => r.user_id === U3);
ok(+c.total === 2 && +c.rank === 2, "U3 scoring correct (2)");

const llb = (await as(U3, `select * from get_leaderboard($1, $2)`, [season, league.id])).rows;
ok(llb.length === 2, "league leaderboard has 2 members");
ok((await as(U1, `select * from get_leaderboard($1, $2)`, [season, league.id])).rows.length === 0, "non-member gets empty league leaderboard");

// owner deletes league / leave
await as(U3, `delete from league_members where league_id = $1 and user_id = $2`, [league.id, U3]);
ok((await as(U2, `select * from league_members where league_id = $1`, [league.id])).rows.length === 1, "member can leave");

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
