#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2959002f5c6dbbaa64dffaad28f80ca7e853ae5ea337ba7552168995d32a8ed6/contract';
import endContract from '../../snapshots/2959002f5c6dbbaa64dffaad28f80ca7e853ae5ea337ba7552168995d32a8ed6/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/370e4b2879ab62360ce0775235ca360f4c0cb598c91a11d0215ca184677ccf77/contract';
import startContract from '../../snapshots/370e4b2879ab62360ce0775235ca360f4c0cb598c91a11d0215ca184677ccf77/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'helpOffer',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('message', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('reportId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('volunteerId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'helpOffer_status_check_56f8fe8d',
            "\"status\" IN ('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'helpOffer',
        constraint: 'helpOffer_reportId_volunteerId_key',
        columns: ['reportId', 'volunteerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'helpOffer',
        index: 'helpOffer_reportId_idx_d163019e',
        columns: ['reportId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'helpOffer',
        index: 'helpOffer_reportId_status_idx_79d493b7',
        columns: ['reportId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'helpOffer',
        index: 'helpOffer_volunteerId_idx_b41cb3e4',
        columns: ['volunteerId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'helpOffer',
        foreignKey: {
          name: 'helpOffer_reportId_fkey',
          columns: ['reportId'],
          references: { schema: 'public', table: 'report', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'helpOffer',
        foreignKey: {
          name: 'helpOffer_volunteerId_fkey',
          columns: ['volunteerId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
