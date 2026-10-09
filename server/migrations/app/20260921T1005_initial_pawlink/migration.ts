#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/370e4b2879ab62360ce0775235ca360f4c0cb598c91a11d0215ca184677ccf77/contract';
import endContract from '../../snapshots/370e4b2879ab62360ce0775235ca360f4c0cb598c91a11d0215ca184677ccf77/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'pet',
        columns: [
          col('birthDate', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('breed', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('color', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('medicalNotes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('microchipNumber', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ownerId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('photoUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('sex', 'text', {
            notNull: true,
            default: lit('UNKNOWN'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('species', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('pet_sex_check_35ee12d4', "\"sex\" IN ('MALE', 'FEMALE', 'UNKNOWN')"),
          checkExpression('pet_species_check_bc68df6f', "\"species\" IN ('DOG', 'CAT', 'OTHER')"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'report',
        columns: [
          col('animalType', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('assignedToId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('latitude', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('locationText', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('longitude', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('photoUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('reporterId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('OPEN'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'report_animalType_check_57f91e72',
            "\"animalType\" IN ('DOG', 'CAT', 'OTHER')",
          ),
          checkExpression(
            'report_status_check_8580ec13',
            "\"status\" IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')",
          ),
          checkExpression(
            'report_type_check_5dbc79f1',
            "\"type\" IN ('INJURED', 'LOST', 'FOUND', 'NEEDS_RESCUE')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'reportUpdate',
        columns: [
          col('authorId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('message', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('reportId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'reportUpdate_status_check_8580ec13',
            "\"status\" IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'user',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('username', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'vaccination',
        columns: [
          col('clinicName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('documentUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nextDueAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('petId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('vaccinatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'pet',
        constraint: 'pet_microchipNumber_key',
        columns: ['microchipNumber'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_email_key',
        columns: ['email'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_username_key',
        columns: ['username'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pet',
        index: 'pet_ownerId_idx_e2d0c1ef',
        columns: ['ownerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'report',
        index: 'report_assignedToId_idx_45a131c2',
        columns: ['assignedToId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'report',
        index: 'report_reporterId_idx_aa245831',
        columns: ['reporterId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'report',
        index: 'report_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'reportUpdate',
        index: 'reportUpdate_authorId_idx_e47547ed',
        columns: ['authorId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'reportUpdate',
        index: 'reportUpdate_reportId_idx_d163019e',
        columns: ['reportId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'vaccination',
        index: 'vaccination_petId_idx_2a5350a7',
        columns: ['petId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pet',
        foreignKey: {
          name: 'pet_ownerId_fkey',
          columns: ['ownerId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'report',
        foreignKey: {
          name: 'report_reporterId_fkey',
          columns: ['reporterId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'report',
        foreignKey: {
          name: 'report_assignedToId_fkey',
          columns: ['assignedToId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'reportUpdate',
        foreignKey: {
          name: 'reportUpdate_reportId_fkey',
          columns: ['reportId'],
          references: { schema: 'public', table: 'report', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'reportUpdate',
        foreignKey: {
          name: 'reportUpdate_authorId_fkey',
          columns: ['authorId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'vaccination',
        foreignKey: {
          name: 'vaccination_petId_fkey',
          columns: ['petId'],
          references: { schema: 'public', table: 'pet', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
