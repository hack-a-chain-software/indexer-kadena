import '../models/guard';

import { QueryTypes } from 'sequelize';

import { sequelize } from './database';

export async function initializeDatabase(noTrigger = true): Promise<void> {
  try {
    await sequelize.authenticate();
    console.info('[INFO][DB][CONN] Database connection established successfully.');
  } catch (error) {
    console.error('[ERROR][DB][CONN_REFUSED] Unable to connect to database:', error);
    throw error;
  }

  const [row] = await sequelize.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1 FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'SequelizeMeta' AND n.nspname = 'public'
      )
    `,
    { type: QueryTypes.SELECT },
  );

  if (row?.exists) {
    console.info('[INFO][DB][DATA] Database already initialized. Creation skipped.');
    return;
  }

  try {
    await sequelize.query(`
          CREATE EXTENSION pg_trgm;
          CREATE EXTENSION btree_gin;
      `);

    // Only sync specific tables that don't have migrations
    const tablesToSync = [
      'Balances',
      'Blocks',
      'Contracts',
      'Events',
      'Guards',
      'Signers',
      'StreamingErrors',
      'Transactions',
      'Transfers',
    ];

    // Get all models
    const models = Object.values(sequelize.models);

    // Sync only the specified tables
    for (const model of models) {
      const tableNameObj = model.getTableName();
      const tableName =
        typeof tableNameObj === 'string'
          ? tableNameObj
          : (tableNameObj as { tableName: string }).tableName;

      if (tablesToSync.includes(tableName)) {
        try {
          await model.sync({ force: false });
        } catch (error) {
          console.warn(`[WARN][DB][INFRA_CONFIG] Could not sync table ${tableName}:`, error);
        }
      }
    }

    console.info('[INFO][DB][INFRA_CONFIG] Database tables synchronized successfully.');

    if (noTrigger) return;

    // --------------------------------
    // Balances
    // --------------------------------

    console.info('[INFO][DB][INFRA_CONFIG] Creating update_balances() function...');

    // Create the update_balances function
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION update_balances() RETURNS TRIGGER AS $$
        DECLARE
            sender_balance numeric;
            recipient_balance numeric;
            contract_id int4;
        BEGIN
            -- Retrieve contractId
            SELECT id INTO contract_id
            FROM public."Contracts"
            WHERE "network" = NEW.network
              AND "chainId" = NEW."chainId"
              AND "module" = NEW.modulename
              AND "tokenId" IS NOT DISTINCT FROM NEW."tokenId"
            LIMIT 1;
      
            -- Update sender balance
            SELECT "balance" INTO sender_balance
            FROM public."Balances"
            WHERE "account" = NEW.from_acct
              AND "chainId" = NEW."chainId"
              AND "qualname" = NEW.modulename
              AND "network" = NEW.network
              AND "tokenId" IS NOT DISTINCT FROM NEW."tokenId"
            FOR UPDATE;
      
            IF FOUND THEN
                IF NEW."canonical" IS FALSE THEN
                    UPDATE public."Balances"
                    SET balance = sender_balance + NEW.amount, -- Revert operation
                        "contractId" = contract_id
                    WHERE "account" = NEW.from_acct
                      AND "chainId" = NEW."chainId"
                      AND "qualname" = NEW.modulename
                      AND "network" = NEW.network
                      AND "tokenId" IS NOT DISTINCT FROM NEW."tokenId";
                ELSE
                    UPDATE public."Balances"
                    SET balance = sender_balance - NEW.amount,
                        "contractId" = contract_id
                    WHERE "account" = NEW.from_acct
                      AND "chainId" = NEW."chainId"
                      AND "qualname" = NEW.modulename
                      AND "network" = NEW.network
                      AND "tokenId" IS NOT DISTINCT FROM NEW."tokenId";
                END IF;
            ELSE
                INSERT INTO public."Balances" (account, "chainId", balance, module, qualname, "tokenId", network, "createdAt", "updatedAt", "hasTokenId", "contractId")
                VALUES (NEW.from_acct, NEW."chainId", CASE WHEN NEW."canonical" IS FALSE THEN NEW.amount ELSE -NEW.amount END, NEW.modulename, NEW.modulename, NEW."tokenId", NEW.network, NEW."createdAt", NEW."updatedAt", 
                CASE WHEN NEW."tokenId" IS NOT NULL THEN true ELSE false END, contract_id);
            END IF;
      
            -- Update recipient balance
            SELECT balance INTO recipient_balance
            FROM public."Balances"
            WHERE "account" = NEW.to_acct
              AND "chainId" = NEW."chainId"
              AND "qualname" = NEW.modulename
              AND "network" = NEW.network
              AND "tokenId" IS NOT DISTINCT FROM NEW."tokenId"
            FOR UPDATE;
      
            IF FOUND THEN
                IF NEW."canonical" IS FALSE THEN
                    UPDATE public."Balances"
                    SET balance = recipient_balance - NEW.amount, -- Revert operation
                        "contractId" = contract_id
                    WHERE "account" = NEW.to_acct
                      AND "chainId" = NEW."chainId"
                      AND "qualname" = NEW.modulename
                      AND "network" = NEW.network
                      AND "tokenId" IS NOT DISTINCT FROM NEW."tokenId";
                ELSE
                    UPDATE public."Balances"
                    SET balance = recipient_balance + NEW.amount,
                        "contractId" = contract_id
                    WHERE "account" = NEW.to_acct
                      AND "chainId" = NEW."chainId"
                      AND "qualname" = NEW.modulename
                      AND "network" = NEW.network
                      AND "tokenId" IS NOT DISTINCT FROM NEW."tokenId";
                END IF;
            ELSE
                INSERT INTO public."Balances" (account, "chainId", balance, module, qualname, "tokenId", network, "createdAt", "updatedAt", "hasTokenId", "contractId")
                VALUES (NEW.to_acct, NEW."chainId", CASE WHEN NEW."canonical" IS FALSE THEN -NEW.amount ELSE NEW.amount END, NEW.modulename, NEW.modulename, NEW."tokenId", NEW.network, NEW."createdAt", NEW."updatedAt", 
                CASE WHEN NEW."tokenId" IS NOT NULL THEN true ELSE false END, contract_id);
            END IF;
      
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    console.info('[INFO][DB][INFRA_CONFIG] Sync update_balances_trigger()...');

    // Create the trigger
    await sequelize.query(`
      CREATE OR REPLACE TRIGGER update_balances_trigger
      AFTER UPDATE ON public."Transfers"
      FOR EACH ROW
      EXECUTE FUNCTION update_balances();
    `);

    //   console.info('Sync public."Balances"...');

    //   // Create the balances table
    //   await sequelize.query(`
    //   CREATE TABLE IF NOT EXISTS public."Balances" (
    //     id serial4 NOT NULL,
    //     account varchar(255) NOT NULL,
    //     "chainId" int4 NOT NULL,
    //     balance numeric(50) DEFAULT 0 NOT NULL,
    //     "module" varchar(255) NOT NULL,
    //     qualname varchar(255) NOT NULL,
    //     "tokenId" varchar(255) NULL,
    //     network varchar(255) NOT NULL,
    //     "hasTokenId" boolean DEFAULT false NOT NULL,
    //     "contractId" int4 NULL,
    //     "createdAt" timestamptz NOT NULL,
    //     "updatedAt" timestamptz NOT NULL,
    //     CONSTRAINT "Balances_pkey" PRIMARY KEY (id)
    //   );

    //   DO $$
    //   BEGIN
    //       IF NOT EXISTS (
    //           SELECT 1
    //           FROM pg_indexes
    //           WHERE schemaname = 'public'
    //             AND tablename = 'Balances'
    //             AND indexname = 'balance_unique_constraint'
    //       ) THEN
    //           CREATE UNIQUE INDEX balance_unique_constraint ON public."Balances" USING btree (network, "chainId", account, qualname, "tokenId");
    //       END IF;
    //   END $$;
    // `);

    // --------------------------------
    // Missing blocks
    // --------------------------------

    // console.info("Sync missing_block_ranges...");

    //   // Create missing blocks view
    //   await sequelize.query(`
    // CREATE OR REPLACE VIEW missing_block_ranges AS
    // WITH missing_ranges AS (
    //   SELECT DISTINCT
    //     "chainId",
    //     "chainwebVersion",
    //     height + 1 AS missing_start,
    //     next_height - 1 AS missing_end
    //   FROM (
    //     SELECT
    //       "chainId",
    //       "chainwebVersion",
    //       height,
    //       LEAD(height) OVER (PARTITION BY "chainId", "chainwebVersion" ORDER BY height) AS next_height
    //     FROM "Blocks"
    //   ) AS t
    //   WHERE next_height IS NOT NULL AND next_height <> height + 1
    // )
    // SELECT DISTINCT
    //   "chainId",
    //   "chainwebVersion",
    //   missing_start AS from_height,
    //   missing_end AS to_height,
    //   (missing_end - missing_start) AS diff
    // FROM missing_ranges
    // where (missing_end - missing_start) >= 0
    // ORDER BY "chainId", "chainwebVersion", missing_start ASC;
    // `);

    // --------------------------------
    // Orphan blocks
    // --------------------------------

    console.info('[INFO][DB][INFRA_CONFIG] Sync public.check_canonical()...');

    // Create the check canonical function
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION public.check_canonical(new_hash character varying, target_height integer, chain_id integer, chainweb_version character varying, current_depth integer)
      RETURNS boolean
      LANGUAGE plpgsql
      AS $function$
        DECLARE
            parent_block RECORD;
        BEGIN
            -- Get the parent of the new block
            SELECT * INTO parent_block 
            FROM public."Blocks" 
            WHERE hash = (SELECT parent FROM public."Blocks" WHERE hash = new_hash AND "chainId" = chain_id AND "chainwebVersion" = chainweb_version)
              FOR UPDATE;
      
            -- Base case: If parent block is not found
            IF parent_block IS NULL THEN
                RETURN FALSE;
            ELSIF parent_block.height = target_height THEN
                -- Update the parent block to be canonical if height matches
                UPDATE public."Blocks" 
                SET canonical = TRUE 
                WHERE hash = parent_block.hash;
      
                UPDATE public."Blocks"
                SET canonical = FALSE
                WHERE height = target_height
                  AND "chainId" = chain_id
                  AND "chainwebVersion" = chainweb_version
                  AND hash != parent_block.hash;
              
                RETURN TRUE;
            ELSE
                -- Recursive case: Check the parent
                IF current_depth > 0 THEN
                    RETURN check_canonical(parent_block.hash, target_height, chain_id, chainweb_version, current_depth - 1);
                ELSE
                    RETURN FALSE;
                END IF;
            END IF;
        END;
        $function$
    ;`);

    //   console.info("Sync public.check_backward_orphans()...");

    //   // Create the check backward orphans function
    //   await sequelize.query(`
    // CREATE OR REPLACE FUNCTION public.check_backward_orphans()
    //  RETURNS trigger
    //  LANGUAGE plpgsql
    // AS $function$
    // DECLARE
    //     recent_blocks RECORD;
    //     previous_block RECORD;
    //     first_block RECORD;
    //     block_count INT := 0;
    //     depth CONSTANT INT := 10; -- Default the depth constant
    //     buffer CONSTANT INT := 5; -- Number of heights to buffer, because some blocks can arrive out of order
    // BEGIN
    //     PERFORM pg_advisory_xact_lock(hashtext(NEW."chainId"::text || NEW."chainwebVersion"::text));

    //     -- Check the last 'depth' blocks
    //     FOR recent_blocks IN
    //         SELECT * FROM public."Blocks"
    //         WHERE height BETWEEN (NEW.height - buffer - depth) AND (NEW.height - buffer - 1)
    //             AND "chainId" = NEW."chainId"
    //             AND "chainwebVersion" = NEW."chainwebVersion"
    //             AND COALESCE(canonical, TRUE)
    //         ORDER BY height ASC
    //         FOR NO KEY UPDATE
    //     LOOP
    //         -- Set the first block
    //         IF block_count = 0 THEN
    //             first_block := recent_blocks;
    //         END IF;

    //         IF previous_block IS NULL THEN
    //         ELSE
    //         -- Check for non-duplicated block
    //             IF previous_block.height = recent_blocks.height
    //                 AND (recent_blocks.canonical = FALSE OR recent_blocks.canonical IS NULL) THEN
    //                 PERFORM check_canonical(first_block.hash, recent_blocks.height, recent_blocks."chainId", recent_blocks."chainwebVersion", depth);
    //             ELSE
    //                 UPDATE public."Blocks"
    //                 SET canonical = TRUE
    //                 WHERE hash = recent_blocks.hash
    //                 AND "chainId" = NEW."chainId"
    //                 AND "chainwebVersion" = NEW."chainwebVersion";
    //             END IF;
    //         END IF;

    //         -- Check for gaps
    //         IF recent_blocks.height <> (NEW.height - buffer) - block_count - 1 THEN
    //             -- If there are gaps, do not change canonical status
    //             RETURN NEW;
    //         END IF;

    //         previous_block := recent_blocks;
    //         block_count := block_count + 1;
    //     END LOOP;

    //     IF previous_block IS NULL THEN
    //         RETURN NEW;
    //     END IF;

    //     RETURN NEW;
    // END;
    // $function$
    // ;`);

    console.info('[INFO][DB][INFRA_CONFIG] Sync public.check_upward_orphans()...');

    await sequelize.query(`
      CREATE OR REPLACE FUNCTION public.check_upward_orphans()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
      DECLARE
          recent_blocks RECORD;
          previous_block RECORD;
          first_block RECORD;
          block_count INT := 0;
          depth CONSTANT INT := 10; -- Default the depth constant
          buffer CONSTANT INT := 5; -- Number of heights to buffer, because some blocks can arrive out of order
          no_duplicates BOOLEAN := TRUE;
          total_rows INT := 0;
      BEGIN
          -- Calculate the total number of rows in the range
          SELECT count(*) INTO total_rows FROM public."Blocks"
          WHERE height >= NEW.height AND height < ((NEW.height + buffer) + depth)
              AND "chainId" = NEW."chainId"
              AND "chainwebVersion" = NEW."chainwebVersion";
      
          -- No sufficient blocks to validate
          IF total_rows < (buffer + depth) THEN
              RETURN NEW;
          END IF;
      
          -- Check the last 'depth' blocks
          FOR recent_blocks IN 
              SELECT * FROM public."Blocks"
              WHERE height >= NEW.height AND height <((NEW.height + buffer) + depth)
                  AND "chainId" = NEW."chainId"
                  AND "chainwebVersion" = NEW."chainwebVersion"
              ORDER BY height DESC
          LOOP
              -- Set the first block
              IF block_count = 0 THEN
                  first_block := recent_blocks;
              END IF;
      
              IF previous_block IS NOT NULL THEN
                  -- Check for non-duplicated block
                  IF previous_block.height = recent_blocks.height 
                      AND previous_block.canonical = FALSE
                      AND recent_blocks.canonical = FALSE THEN
                      -- duplicated block
                      PERFORM check_canonical(first_block.hash, recent_blocks.height, recent_blocks."chainId", recent_blocks."chainwebVersion", depth);
                      no_duplicates := FALSE;
                  END IF;
              END IF;
      
              -- Check for gaps
              IF recent_blocks.height <> (NEW.height + buffer) - block_count - 1 THEN
                  -- If there are gaps, do not change canonical status
                  RETURN NEW;
              END IF;
      
              previous_block := recent_blocks;
              block_count := block_count + 1;
          END LOOP;
        
          -- If there are no gaps and no duplicates, update the last block to canonical
          IF no_duplicates THEN
              UPDATE public."Blocks"
              SET canonical = TRUE
              WHERE hash = NEW.hash
              AND "chainId" = NEW."chainId" 
              AND "chainwebVersion" = NEW."chainwebVersion";
          END IF;
      
          RETURN NEW;
      END;
      $function$
    ;`);

    console.info('[INFO][DB][INFRA_CONFIG] Sync blocks_propagate_canonical_function()...');

    // Propagate canonical trigger to transactions
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION blocks_propagate_canonical_function()
      RETURNS TRIGGER AS $$
      BEGIN
          UPDATE public."Transactions"
          SET canonical = NEW.canonical
          WHERE "blockId" = NEW.id;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.info('[INFO][DB][INFRA_CONFIG] Sync blocks_propagate_canonical...');

    await sequelize.query(`
      CREATE OR REPLACE TRIGGER blocks_propagate_canonical
      AFTER UPDATE ON public."Blocks"
      FOR EACH ROW
      EXECUTE FUNCTION blocks_propagate_canonical_function();
    `);

    console.info('[INFO][DB][INFRA_CONFIG] Sync transactions_propagate_canonical_function...');

    // Propagate canonical trigger to transfers
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION transactions_propagate_canonical_function()
      RETURNS TRIGGER AS $$
      BEGIN
          UPDATE public."Transfers"
          SET canonical = NEW.canonical
          WHERE "transactionId" = NEW.id;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.info('[INFO][DB][INFRA_CONFIG] Sync transactions_propagate_canonical...');

    await sequelize.query(`
      CREATE OR REPLACE TRIGGER transactions_propagate_canonical
      AFTER UPDATE ON public."Transactions"
      FOR EACH ROW
      EXECUTE FUNCTION transactions_propagate_canonical_function();
    `);

    // console.info("Sync check_orphan_blocks_backward...");

    // // Create orphan blocks trigger
    // await sequelize.query(`
    //   CREATE OR REPLACE TRIGGER check_orphan_blocks_backward
    //   AFTER INSERT ON public."Blocks"
    //   FOR EACH ROW
    //   EXECUTE FUNCTION check_backward_orphans();`);

    console.info('[INFO][DB][INFRA_CONFIG] Sync check_orphan_blocks_upward...');

    await sequelize.query(`
      CREATE OR REPLACE TRIGGER check_orphan_blocks_upward
      AFTER INSERT ON public."Blocks" 
      FOR EACH ROW
      EXECUTE FUNCTION check_upward_orphans();
    `);

    console.info('[INFO][DB][INFRA_CONFIG] Sync public.update_transactions_count()...');

    await sequelize.query(`
      CREATE OR REPLACE FUNCTION public.update_transactions_count()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
      BEGIN
          UPDATE public."Balances"
          SET "transactionsCount" = COALESCE("transactionsCount", 0) + 1
          WHERE account = NEW.sender
            AND "chainId" = NEW."chainId";
        
          RETURN NEW;
      END;
      $function$
    ;`);

    console.info('[INFO][DB][INFRA_CONFIG] Sync trigger_update_transactions_count...');

    await sequelize.query(`
      CREATE OR REPLACE TRIGGER trigger_update_transactions_count after
      insert
          on
          public."Transactions" for each row execute function update_transactions_count()
      ;
    `);

    // Update fungibles count

    console.info('[INFO][DB][INFRA_CONFIG] Sync public.update_fungibles_count()...');

    await sequelize.query(`
      CREATE OR REPLACE FUNCTION public.update_fungibles_count()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
      BEGIN
          
          UPDATE public."Balances" b
          SET "fungiblesCount" = (
              SELECT COUNT(DISTINCT qualname)
              FROM public."Balances"
              WHERE account = b.account AND "tokenId" IS NULL
          );
          
          RETURN NEW;
      END;
      $function$
      ;
    `);

    console.info('[INFO][DB][INFRA_CONFIG] Sync trigger_update_fungibles_count...');

    await sequelize.query(`
      create or replace trigger trigger_update_fungibles_count after
      insert
          on
          public."Balances" for each row execute function update_fungibles_count()
      ;
    `);

    // Update polyfungibles count

    console.info('[INFO][DB][INFRA_CONFIG] Sync public.update_polyfungibles_count()...');

    await sequelize.query(`
      CREATE OR REPLACE FUNCTION public.update_polyfungibles_count()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
      BEGIN
          
          UPDATE public."Balances" b
          SET "polyfungiblesCount" = (
              SELECT COUNT(DISTINCT qualname)
              FROM public."Balances"
              WHERE account = b.account AND "tokenId" IS not NULL
          );
          
          RETURN NEW;
      END;
      $function$
      ;
    `);

    console.info('[INFO][DB][INFRA_CONFIG] Sync trigger_update_polyfungibles_count...');

    await sequelize.query(`
      create or replace trigger trigger_update_polyfungibles_count after
      insert
          on
          public."Balances" for each row execute function update_polyfungibles_count()
      ;
    `);

    console.info('[INFO][DB][INFRA_CONFIG] Sync public.get_holders_by_module...');

    await sequelize.query(`
      CREATE OR REPLACE FUNCTION public.get_holders_by_module(
          module_name VARCHAR(255),
          before VARCHAR(255) DEFAULT NULL,
          after VARCHAR(255) DEFAULT NULL,
          first INT DEFAULT NULL,
          last INT DEFAULT NULL
      )
      RETURNS TABLE (
          row_id BIGINT,
          address VARCHAR(255),
          quantity NUMERIC,
          percentage NUMERIC,
          total_count BIGINT
      ) AS $$
      BEGIN
          RETURN QUERY
          WITH ranked_balances AS (
              SELECT 
                  ROW_NUMBER() OVER (ORDER BY SUM(balance) DESC) AS rn,
                  COUNT(*) OVER () AS total_count,  -- Calculate total count of all matching rows
                  b.account AS address,
                  SUM(b.balance) AS quantity,
                  SUM(b.balance) * 100.0 / (SELECT SUM(balance) FROM public."Balances" WHERE "module" = module_name AND balance > 0) AS percentage
              FROM 
                  public."Balances" b
              WHERE 
                  b."module" = module_name AND b.balance > 0
              GROUP BY 
                  b.account
              ORDER BY
                  percentage DESC
          )
          SELECT 
              ranked_balances.rn AS row_id,
              ranked_balances.address,
              ranked_balances.quantity,
              ranked_balances.percentage,
              ranked_balances.total_count
          FROM 
              ranked_balances
          WHERE
              (after IS NULL OR ranked_balances.rn > CAST(CONVERT_FROM(DECODE(after, 'base64'), 'UTF8') AS BIGINT))
              AND (before IS NULL OR ranked_balances.rn < CAST(CONVERT_FROM(DECODE(before, 'base64'), 'UTF8') AS BIGINT))
          ORDER BY
              ranked_balances.rn ASC
          OFFSET 
              COALESCE(
                  CASE 
                      WHEN last IS NOT NULL THEN 
                          (SELECT GREATEST(COUNT(*) - last, 0) FROM ranked_balances)
                      ELSE 
                          0 
                  END, 
                  0
              )
          FETCH FIRST COALESCE(first, last) ROWS ONLY;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.info(
      '[INFO][DB][INFRA_CONFIG] Trigger function and trigger have been created successfully.',
    );
  } catch (error) {
    console.error('[ERROR][DB][INFRA_CONFIG] Unable to create tables:', error);
    throw error;
  }
}
