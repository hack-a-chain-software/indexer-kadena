CREATE TABLE blocks (
    chainid bigint NOT NULL,
    creationtime timestamp with time zone NOT NULL,
    epoch timestamp with time zone NOT NULL,
    flags numeric(20,0) NOT NULL,
    hash character varying NOT NULL,
    height bigint NOT NULL,
    miner character varying NOT NULL,
    nonce numeric(20,0) NOT NULL,
    parent character varying NOT NULL,
    payload character varying NOT NULL,
    powhash character varying NOT NULL,
    predicate character varying NOT NULL,
    target numeric(80,0) NOT NULL,
    weight numeric(80,0) NOT NULL
);

ALTER TABLE ONLY blocks
    ADD CONSTRAINT blocks_pkey PRIMARY KEY (hash);

CREATE TABLE events (
    block character varying NOT NULL,
    chainid bigint NOT NULL,
    height bigint NOT NULL,
    idx bigint NOT NULL,
    module character varying NOT NULL,
    modulehash character varying NOT NULL,
    name character varying NOT NULL,
    params jsonb NOT NULL,
    paramtext character varying NOT NULL,
    qualname character varying NOT NULL,
    requestkey character varying NOT NULL
);

ALTER TABLE ONLY events
    ADD CONSTRAINT events_pkey PRIMARY KEY (block, idx, requestkey);

ALTER TABLE ONLY events
    ADD CONSTRAINT events_block_fkey FOREIGN KEY (block) REFERENCES blocks(hash);

CREATE INDEX events_height_chainid_idx
  ON events
  USING btree (height DESC, chainid, idx);

CREATE INDEX events_height_name_expr_expr1_idx
  ON events
  USING btree (height DESC, name, ((params ->> 0)), ((params ->> 1))) WHERE ((name)::text = 'TRANSFER'::text);

CREATE INDEX events_requestkey_idx
  ON events
  USING btree (requestkey);

CREATE TABLE minerkeys (
    block character varying NOT NULL,
    key character varying NOT NULL
);

ALTER TABLE ONLY minerkeys
    ADD CONSTRAINT minerkeys_pkey PRIMARY KEY (block, key);

ALTER TABLE ONLY minerkeys
    ADD CONSTRAINT minerkeys_block_fkey FOREIGN KEY (block) REFERENCES blocks(hash);


CREATE TABLE signers (
    addr character varying,
    caps jsonb NOT NULL,
    idx integer NOT NULL,
    pubkey character varying NOT NULL,
    requestkey character varying NOT NULL,
    scheme character varying,
    sig character varying NOT NULL
);

ALTER TABLE ONLY signers
    ADD CONSTRAINT signers_pkey PRIMARY KEY (idx, requestkey);


CREATE TABLE transactions (
    badresult jsonb,
    block character varying NOT NULL,
    chainid bigint NOT NULL,
    code character varying,
    continuation jsonb,
    creationtime timestamp with time zone NOT NULL,
    data jsonb,
    gas bigint NOT NULL,
    gaslimit bigint NOT NULL,
    gasprice double precision NOT NULL,
    goodresult jsonb,
    height bigint NOT NULL,
    logs character varying,
    metadata jsonb,
    nonce character varying NOT NULL,
    num_events bigint,
    pactid character varying,
    proof character varying,
    requestkey character varying NOT NULL,
    rollback boolean,
    sender character varying NOT NULL,
    step bigint,
    ttl bigint NOT NULL,
    txid bigint
);

ALTER TABLE ONLY transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (block, requestkey);

ALTER TABLE ONLY transactions
    ADD CONSTRAINT transactions_block_fkey FOREIGN KEY (block) REFERENCES blocks(hash);

CREATE INDEX transactions_height_idx
  ON transactions
  USING btree (height);

CREATE INDEX transactions_requestkey_idx
  ON transactions
  USING btree (requestkey);


CREATE TABLE transfers (
    amount numeric NOT NULL,
    block character varying NOT NULL,
    chainid bigint NOT NULL,
    from_acct character varying NOT NULL,
    height bigint NOT NULL,
    idx bigint NOT NULL,
    modulehash character varying NOT NULL,
    modulename character varying NOT NULL,
    requestkey character varying NOT NULL,
    to_acct character varying NOT NULL
);

ALTER TABLE ONLY transfers
    ADD CONSTRAINT transfers_pkey PRIMARY KEY (block, chainid, idx, modulehash, requestkey);

CREATE INDEX transfers_from_acct_height_idx
  ON transfers
  USING btree (from_acct, height DESC, idx);


CREATE INDEX transfers_to_acct_height_idx_idx
  ON transfers
  USING btree (to_acct, height DESC, idx);

ALTER TABLE ONLY transfers
    ADD CONSTRAINT transfers_block_fkey FOREIGN KEY (block) REFERENCES blocks(hash);


CREATE TABLE schema_migrations (
    filename character varying(512) NOT NULL,
    checksum character varying(32) NOT NULL,
    executed_at timestamp without time zone DEFAULT now() NOT NULL
);

-- Add trigger to skip insertion

CREATE OR REPLACE FUNCTION skip_write()
    RETURNS trigger AS $BODY$
        BEGIN
            RETURN NULL;
        END;
    $BODY$

LANGUAGE 'plpgsql';

CREATE OR REPLACE TRIGGER skip_write BEFORE INSERT OR UPDATE ON transfers
FOR EACH ROW
WHEN (pg_trigger_depth() < 1)
EXECUTE PROCEDURE skip_write();

CREATE OR REPLACE TRIGGER skip_write BEFORE INSERT OR UPDATE ON signers
FOR EACH ROW
WHEN (pg_trigger_depth() < 1)
EXECUTE PROCEDURE skip_write();

CREATE OR REPLACE TRIGGER skip_write BEFORE INSERT OR UPDATE ON minerkeys
FOR EACH ROW
WHEN (pg_trigger_depth() < 1)
EXECUTE PROCEDURE skip_write();

-- Add trigger on events table

CREATE OR REPLACE FUNCTION check_opact_event()
    RETURNS trigger AS $BODY$
BEGIN
IF new.module LIKE '%crankk01%' THEN
    INSERT INTO events VALUES (
        new.block,
        new.chainid,
        new.height,
        new.idx,
        new.module,
        new.modulehash,
        new.name,
        new.params,
        new.paramtext,
        new.qualname,
        new.requestkey
    );
END IF;
RETURN NULL;
END;
$BODY$

LANGUAGE 'plpgsql';

CREATE OR REPLACE TRIGGER check_event BEFORE INSERT OR UPDATE ON events
FOR EACH ROW
WHEN (pg_trigger_depth() < 1)
EXECUTE PROCEDURE check_opact_event();

-- Add trigger on transactions table

CREATE OR REPLACE FUNCTION check_opact_transactions()
    RETURNS trigger AS $BODY$
BEGIN
IF new.code LIKE '%free.hello%' THEN
    INSERT INTO transactions VALUES (
        new.badresult,
        new.block,
        new.chainid,
        new.code,
        new.continuation,
        new.creationtime,
        new.data,
        new.gas,
        new.gaslimit,
        new.gasprice,
        new.goodresult,
        new.height,
        new.logs,
        new.metadata,
        new.nonce,
        new.num_events,
        new.pactid,
        new.proof,
        new.requestkey,
        new.rollback,
        new.sender,
        new.step,
        new.ttl,
        new.txid
    );
END IF;
RETURN NULL;
END;
$BODY$

LANGUAGE 'plpgsql';

CREATE OR REPLACE TRIGGER check_opact_transactions BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW
WHEN (pg_trigger_depth() < 1)
EXECUTE PROCEDURE check_opact_transactions();
