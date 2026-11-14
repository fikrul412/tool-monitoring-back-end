
import { Injectable } from "@nestjs/common";
import { InjectDrizzle } from "@nestjs/drizzle";

import {
  and,
  count,
  desc,
  eq,
  ilike,
  or,
  asc
} from "drizzle-orm";

import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  emailVerificationTokens,
  authAccounts,
} from "../database/schema/auth.schema.js";

import {
  users,
  students,
  lecturers,
  type NewUser,
  type User,
  type UpdateUser,
} from "../database/schema/identity.schema.js";

@Injectable()
export class IdentityRepository {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
  ) { }

  // ==========================================
  // USER QUERIES
  // ==========================================

  async findUserById(userId: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user ?? null;
  }

  async findStudentPublicProfile(studentId: string) {
    const [student] = await this.db.select({ id: students.id, name: students.name, nim: students.nim, whatsapp: students.whatsapp })
      .from(students).where(eq(students.id, studentId)).limit(1);
    return student ?? null;
  }

  async updateOwnProfile(userId: string, role: 'STUDENT' | 'LECTURER', data: { name: string; whatsapp: string | null }) {
    if (role === 'STUDENT') {
      const [profile] = await this.db.update(students).set(data).where(eq(students.id, userId)).returning();
      return profile ?? null;
    }
    const [profile] = await this.db.update(lecturers).set(data).where(eq(lecturers.id, userId)).returning();
    return profile ?? null;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  }

  async createUser(newUser: NewUser): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values(newUser)
      .returning();

    return user;
  }

  async searchLecturers(search?: string, limit = 10) {
    return this.db
      .select({
        id: lecturers.id,
        name: lecturers.name,
      })
      .from(lecturers)
      .where(
        search
          ? ilike(lecturers.name, `%${search}%`)
          : undefined,
      )
      .orderBy(asc(lecturers.name))
      .limit(limit);
  }

  async updateUser(
    userId: string,
    data: UpdateUser,
  ): Promise<User | null> {
    const [user] = await this.db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return user ?? null;
  }

  // ==========================================
  // USER PROFILE QUERIES
  // ==========================================

  async findUserWithProfileById(userId: string) {
    const result = await this.db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,

        student: {
          name: students.name,
          nim: students.nim,
          whatsapp: students.whatsapp,
        },

        lecturer: {
          name: lecturers.name,
          nip: lecturers.nip,
          whatsapp: lecturers.whatsapp,
        },
      })
      .from(users)
      .leftJoin(students, eq(students.id, users.id))
      .leftJoin(lecturers, eq(lecturers.id, users.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!result[0]) {
      return null;
    }

    const { student, lecturer, ...user } = result[0];

    return {
      ...user,
      profile:
        user.role === "STUDENT"
          ? student
          : user.role === "LECTURER"
            ? lecturer
            : null,
    };
  }

  async findStudentByNim(nim: string) {
    const [student] = await this.db
      .select()
      .from(students)
      .where(eq(students.nim, nim))
      .limit(1);

    return student ?? null;
  }

  async findLecturerByNip(nip: string) {
    const [lecturer] = await this.db
      .select()
      .from(lecturers)
      .where(eq(lecturers.nip, nip))
      .limit(1);

    return lecturer ?? null;
  }

  async findLecturerByUserId(userId: string) {
    const [lecturer] = await this.db
      .select()
      .from(lecturers)
      .where(eq(lecturers.id, userId))
      .limit(1);

    return lecturer ?? null;
  }

  // ==========================================
  // GOOGLE OAUTH
  // ==========================================

  async findGoogleAccount(providerAccountId: string) {
    const [account] = await this.db
      .select()
      .from(authAccounts)
      .where(
        and(
          eq(authAccounts.provider, "GOOGLE"),
          eq(authAccounts.providerAccountId, providerAccountId),
        ),
      )
      .limit(1);

    return account ?? null;
  }

  async createGoogleUser(data: {
    email: string;
    role: "STUDENT";
    status: "ACTIVE";
    providerAccountId: string;
  }): Promise<User> {
    return this.db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: data.email,
          role: data.role,
          status: data.status,
          passwordHash: null,
        })
        .returning();

      await tx.insert(authAccounts).values({
        userId: user.id,
        provider: "GOOGLE",
        providerAccountId: data.providerAccountId,
      });

      return user;
    });
  }

  async createGoogleAccountLink(
    userId: string,
    providerAccountId: string,
  ) {
    const [account] = await this.db
      .insert(authAccounts)
      .values({
        userId,
        provider: "GOOGLE",
        providerAccountId,
      })
      .returning();

    return account;
  }

  // ==========================================
  // STUDENT REGISTRATION
  // ==========================================

  async createStudentAccount(data: {
    email: string;
    passwordHash: string;
    name: string;
    nim: string;
    status: "PENDING_VERIFICATION";
  }) {
    return this.db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: data.email,
          passwordHash: data.passwordHash,
          role: "STUDENT",
          status: data.status,
        })
        .returning();

      await tx.insert(students).values({
        id: user.id,
        name: data.name,
        nim: data.nim,
      });

      return user;
    });
  }

  // ==========================================
  // EMAIL VERIFICATION
  // ==========================================

  async activateStudentAccount(
    userId: string,
    tokenHash: string,
  ): Promise<User> {
    return this.db.transaction(async (tx) => {
      const [user] = await tx
        .update(users)
        .set({
          status: "ACTIVE",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(users.id, userId),
            eq(users.status, "PENDING_VERIFICATION"),
          ),
        )
        .returning();

      if (!user) {
        throw new Error(
          "User not found or account is already activated.",
        );
      }

      await tx
        .delete(emailVerificationTokens)
        .where(
          and(
            eq(emailVerificationTokens.userId, userId),
            eq(emailVerificationTokens.tokenHash, tokenHash),
          ),
        );

      return user;
    });
  }

  // ==========================================
  // ADMIN: USER MANAGEMENT
  // ==========================================

  async findUsers(params: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const { page, limit, search, role, status } = params;

    const conditions = [];

    if (role) {
      conditions.push(eq(users.role, role as typeof users.role.enumValues[number]));
    }

    if (status) {
      conditions.push(
        eq(users.status, status as typeof users.status.enumValues[number]),
      );
    }

    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(students.name, `%${search}%`),
          ilike(students.nim, `%${search}%`),
          ilike(lecturers.name, `%${search}%`),
          ilike(lecturers.nip, `%${search}%`),
        )!,
      );
    }

    const where = conditions.length
      ? and(...conditions)
      : undefined;

    const [data, totalResult] = await Promise.all([
      this.db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          status: users.status,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,

          student: {
            name: students.name,
            nim: students.nim,
            whatsapp: students.whatsapp,
          },

          lecturer: {
            name: lecturers.name,
            nip: lecturers.nip,
            whatsapp: lecturers.whatsapp,
          },
        })
        .from(users)
        .leftJoin(students, eq(students.id, users.id))
        .leftJoin(lecturers, eq(lecturers.id, users.id))
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),

      this.db
        .select({
          total: count(),
        })
        .from(users)
        .leftJoin(students, eq(students.id, users.id))
        .leftJoin(lecturers, eq(lecturers.id, users.id))
        .where(where),
    ]);

    const total = Number(totalResult[0]?.total ?? 0);

    return {
      data: data.map(({ student, lecturer, ...user }) => ({
        ...user,
        profile:
          user.role === "STUDENT"
            ? student
            : user.role === "LECTURER"
              ? lecturer
              : null,
      })),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createManagedUser(data: {
    email: string;
    passwordHash: string;
    role: "STUDENT" | "LECTURER" | "ADMIN";
    name?: string;
    nim?: string;
    nip?: string;
    whatsapp?: string;
  }) {
    return this.db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role,
          status: "ACTIVE",
        })
        .returning();

      if (data.role === "STUDENT") {
        await tx.insert(students).values({
          id: user.id,
          name: data.name!,
          nim: data.nim!,
          whatsapp: data.whatsapp,
        });
      }

      if (data.role === "LECTURER") {
        await tx.insert(lecturers).values({
          id: user.id,
          name: data.name!,
          nip: data.nip!,
          whatsapp: data.whatsapp,
        });
      }

      return user;
    });
  }
}
