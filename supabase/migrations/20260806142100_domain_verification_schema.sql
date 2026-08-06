-- Domain ownership verification schema (single squashed migration).
-- Stores a plaintext verification token (public in DNS TXT); writes to
-- verifications go through the service-role client only.

create table public.domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  domain text not null,
  status text not null default 'pending',
  current_verification_id uuid,
  status_changed_at timestamptz not null default now(),
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint domains_user_domain_key unique (user_id, domain),
  constraint domains_domain_length_check
    check (char_length(domain) between 3 and 253),
  constraint domains_domain_normalized_check
    check (
      domain = lower(domain)
      and domain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
    ),
  constraint domains_status_check
    check (status in ('pending', 'rejected', 'failed', 'claimed'))
);

create table public.verifications (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains (id) on delete cascade,
  token text not null,
  status text not null default 'pending',
  failure_reason text,
  last_checked_at timestamptz,
  status_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint verifications_token_length_check
    check (char_length(token) between 16 and 128),
  constraint verifications_status_check
    check (status in ('pending', 'rejected', 'failed', 'claimed'))
);

alter table public.domains
  add constraint domains_current_verification_id_fkey
  foreign key (current_verification_id)
  references public.verifications (id)
  on delete set null;

create unique index domains_current_verification_id_key
  on public.domains (current_verification_id)
  where current_verification_id is not null;

create index domains_user_id_status_idx
  on public.domains (user_id, status);

create index verifications_domain_id_idx
  on public.verifications (domain_id);

create or replace function public.set_domain_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();

  if new.status is distinct from old.status then
    new.status_changed_at := now();

    if new.status = 'claimed' and new.claimed_at is null then
      new.claimed_at := now();
    elsif new.status is distinct from 'claimed' then
      new.claimed_at := null;
    end if;
  end if;

  return new;
end;
$$;

create trigger set_domain_timestamps
before update on public.domains
for each row
execute function public.set_domain_timestamps();

create or replace function public.set_verification_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();

  if new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;

  return new;
end;
$$;

create trigger set_verification_timestamps
before update on public.verifications
for each row
execute function public.set_verification_timestamps();

alter table public.domains enable row level security;
alter table public.verifications enable row level security;

create policy "Users can read their own domains"
on public.domains
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own domains"
on public.domains
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own domains"
on public.domains
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own domains"
on public.domains
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read verifications for their domains"
on public.verifications
for select
to authenticated
using (
  exists (
    select 1
    from public.domains
    where domains.id = verifications.domain_id
      and domains.user_id = (select auth.uid())
  )
);

revoke all on table public.domains from anon, authenticated;
revoke all on table public.verifications from anon, authenticated;

grant select, insert, update, delete on table public.domains to authenticated;

grant select (
  id,
  domain_id,
  token,
  status,
  failure_reason,
  last_checked_at,
  status_changed_at,
  created_at,
  updated_at
) on table public.verifications to authenticated;

grant all on table public.domains to service_role;
grant all on table public.verifications to service_role;

revoke execute on function public.set_domain_timestamps() from public, anon, authenticated;
revoke execute on function public.set_verification_timestamps() from public, anon, authenticated;
