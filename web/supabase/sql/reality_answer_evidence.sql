create table if not exists public.reality_answer_evidence (
  chain_id integer not null,
  reality_address text not null,
  question_id text not null,
  history_hash text not null,
  body text not null check (char_length(body) between 1 and 2000),
  primary key (chain_id, reality_address, question_id, history_hash)
);

alter table public.reality_answer_evidence enable row level security;
grant select, insert on public.reality_answer_evidence to service_role;
