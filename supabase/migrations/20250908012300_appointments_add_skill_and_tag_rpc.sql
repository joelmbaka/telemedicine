-- +migrate Up
-- Intentionally left blank (no-op). We are not introducing new relationships.
SELECT 1;

-- +migrate Down
-- No-op. Nothing to revert.
SELECT 1;
