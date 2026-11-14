
import { pgEnum } from 'drizzle-orm/pg-core';

export const userStatusEnum = pgEnum("user_status", [
    "PENDING_VERIFICATION",
    "ACTIVE",
    "INACTIVE",
    "SUSPENDED",
]);

export const userRoleEnum = pgEnum("user_role", [
    "STUDENT",
    "LECTURER",
    "ADMIN",
]);

export enum RuntimeRoleEnum {
    Student = "STUDENT",
    Lecturer = "LECTURER",
    Admin = "ADMIN"
}

export const researchStatusEnum = pgEnum('research_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'ONGOING',
  'COMPLETION_REQUESTED',
  'COMPLETED',
  'ARCHIVED',
  'CANCELLED',
]);

export const toolStatusEnum = pgEnum('tool_status', [
  'AVAILABLE',
  'IN_USE',
  'MAINTENANCE',
  'UNAVAILABLE',
]);

export const toolOwnerTypeEnum = pgEnum('tool_owner_type', [
  'LAB',
  'LECTURER',
]);

export const materialOwnerTypeEnum = pgEnum('material_owner_type', [
  'LAB',
  'LECTURER',
]);

export const wastePhaseEnum = pgEnum('waste_phase', [
  'SOLID',
  'LIQUID',
  'GAS',
]);

export const wasteHandlingEnum = pgEnum('waste_handling', [
  'TAKE_HOME',
  'LAB',
]);

export const attendanceStatusEnum = pgEnum('attendance_status', [
  'ENTRY',
  'EXIT',
]);

export const scheduleLogTypeEnum = pgEnum('schedule_log_type', [
  'REQUEST',
  'RETURN',
  'CANCEL',
]);

export const borrowingTypeEnum = pgEnum('borrowing_type', [
  'BORROW',
  'RETURN',
]);

export const borrowingStatusEnum = pgEnum('borrowing_status', [
  'PENDING',
  'AVAILABLE',
  'BORROWED',
  'DAMAGED',
  'LOST',
  'REJECTED',
]);

export const materialRequestStatusEnum = pgEnum('material_request_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
]);

export const authProviderEnum = pgEnum('auth_provider', [
  'GOOGLE',
  'LOCAL',
]);

// User Status
export type UserStatus =
  (typeof userStatusEnum.enumValues)[number];

// Research Status
export type ResearchStatus =
  (typeof researchStatusEnum.enumValues)[number];

// Tool Status
export type ToolStatus =
  (typeof toolStatusEnum.enumValues)[number];

// Tool Owner Type
export type ToolOwnerType =
  (typeof toolOwnerTypeEnum.enumValues)[number];

// Material Owner Type
export type MaterialOwnerType =
  (typeof materialOwnerTypeEnum.enumValues)[number];

// Waste Phase
export type WastePhase =
  (typeof wastePhaseEnum.enumValues)[number];

// Waste Handling
export type WasteHandling =
  (typeof wasteHandlingEnum.enumValues)[number];

// Attendance Status
export type AttendanceStatus =
  (typeof attendanceStatusEnum.enumValues)[number];

// Schedule Log Type
export type ScheduleLogType =
  (typeof scheduleLogTypeEnum.enumValues)[number];

// Borrowing Type
export type BorrowingType =
  (typeof borrowingTypeEnum.enumValues)[number];

// Borrowing Status
export type BorrowingStatus =
  (typeof borrowingStatusEnum.enumValues)[number];

// Authentication Provider
export type AuthProvider =
  (typeof authProviderEnum.enumValues)[number];
