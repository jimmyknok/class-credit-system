import { supabase } from './supabase';
import type { Student, Group, PointRule, PointRecord, ShopItem, AppState } from '../app/context/AppContext';

// ── Row mappers (DB snake_case → TS camelCase) ──────────────────

export function rowToStudent(r: Record<string, unknown>): Student {
    return {
        id: r.id as string,
        name: r.name as string,
        gender: r.gender as string | undefined,
        studentId: r.student_id_no as string | undefined,
        groupId: (r.group_id as string | null) ?? null,
        totalPoints: (r.total_points as number) ?? 0,
        availablePoints: (r.available_points as number) ?? 0,
        createdAt: r.created_at as string,
    };
}

export function rowToGroup(r: Record<string, unknown>): Group {
    return { id: r.id as string, name: r.name as string, color: (r.color as string) ?? '#6366f1' };
}

export function rowToRule(r: Record<string, unknown>): PointRule {
    return { id: r.id as string, name: r.name as string, points: r.points as number, icon: (r.icon as string) ?? '📌' };
}

export function rowToShopItem(r: Record<string, unknown>): ShopItem {
    return {
        id: r.id as string,
        name: r.name as string,
        requiredPoints: r.required_points as number,
        stock: r.stock as number,
        description: (r.description as string) ?? '',
        sold: (r.sold as number) ?? 0,
    };
}

export function rowToRecord(r: Record<string, unknown>): PointRecord {
    return {
        id: r.id as string,
        studentId: r.student_id as string,
        type: r.type as 'earn' | 'deduct' | 'redeem',
        points: r.points as number,
        reason: (r.reason as string) ?? '',
        ruleId: r.rule_id as string | undefined,
        shopItemId: r.shop_item_id as string | undefined,
        createdAt: r.created_at as string,
    };
}

// ── Full load ────────────────────────────────────────────────────

export async function fetchAll(): Promise<AppState> {
    const [
        { data: students, error: e1 },
        { data: groups, error: e2 },
        { data: rules, error: e3 },
        { data: shop, error: e4 },
        { data: records, error: e5 },
    ] = await Promise.all([
        supabase.from('students').select('*').order('created_at'),
        supabase.from('groups').select('*'),
        supabase.from('rules').select('*'),
        supabase.from('shop_items').select('*'),
        supabase.from('point_records').select('*').order('created_at', { ascending: false }),
    ]);

    if (e1 || e2 || e3 || e4 || e5) {
        const msg = [e1, e2, e3, e4, e5].find(Boolean)?.message;
        throw new Error('加载数据失败: ' + msg);
    }

    return {
        students: (students ?? []).map(rowToStudent),
        groups: (groups ?? []).map(rowToGroup),
        rules: (rules ?? []).map(rowToRule),
        shopItems: (shop ?? []).map(rowToShopItem),
        records: (records ?? []).map(rowToRecord),
    };
}

// ── Student ops ──────────────────────────────────────────────────

export async function dbAddStudent(s: Student) {
    await supabase.from('students').insert({
        id: s.id, name: s.name, gender: s.gender, student_id_no: s.studentId,
        group_id: s.groupId, total_points: s.totalPoints, available_points: s.availablePoints,
        created_at: s.createdAt,
    });
}

export async function dbUpdateStudent(id: string, name: string, groupId: string | null) {
    await supabase.from('students').update({ name, group_id: groupId }).eq('id', id);
}

export async function dbDeleteStudent(id: string) {
    await supabase.from('students').delete().eq('id', id);
}

export async function dbDeleteStudents(ids: string[]) {
    await supabase.from('students').delete().in('id', ids);
}

export async function dbAssignGroup(ids: string[], groupId: string | null) {
    await supabase.from('students').update({ group_id: groupId }).in('id', ids);
}

export async function dbImportStudents(students: Student[]) {
    await supabase.from('students').insert(students.map(s => ({
        id: s.id, name: s.name, gender: s.gender, student_id_no: s.studentId,
        group_id: s.groupId, total_points: 0, available_points: 0, created_at: s.createdAt,
    })));
}

// ── Group ops ────────────────────────────────────────────────────

export async function dbAddGroup(g: Group) {
    await supabase.from('groups').insert({ id: g.id, name: g.name, color: g.color });
}

export async function dbUpdateGroup(id: string, name: string, color: string) {
    await supabase.from('groups').update({ name, color }).eq('id', id);
}

export async function dbDeleteGroup(id: string) {
    await supabase.from('groups').delete().eq('id', id);
}

// ── Rule ops ─────────────────────────────────────────────────────

export async function dbAddRule(r: PointRule) {
    await supabase.from('rules').insert({ id: r.id, name: r.name, points: r.points, icon: r.icon });
}

export async function dbUpdateRule(id: string, name: string, points: number, icon: string) {
    await supabase.from('rules').update({ name, points, icon }).eq('id', id);
}

export async function dbDeleteRule(id: string) {
    await supabase.from('rules').delete().eq('id', id);
}

// ── Shop ops ─────────────────────────────────────────────────────

export async function dbAddShopItem(item: ShopItem) {
    await supabase.from('shop_items').insert({
        id: item.id, name: item.name, required_points: item.requiredPoints,
        stock: item.stock, description: item.description, sold: item.sold,
    });
}

export async function dbUpdateShopItem(id: string, name: string, requiredPoints: number, stock: number, description: string) {
    await supabase.from('shop_items').update({ name, required_points: requiredPoints, stock, description }).eq('id', id);
}

export async function dbDeleteShopItem(id: string) {
    await supabase.from('shop_items').delete().eq('id', id);
}

// ── Point ops ────────────────────────────────────────────────────

export async function dbApplyPoints(
    studentUpdates: { id: string; totalPoints: number; availablePoints: number }[],
    newRecords: PointRecord[],
) {
    // Insert all records in one batch
    await supabase.from('point_records').insert(newRecords.map(r => ({
        id: r.id, student_id: r.studentId, type: r.type, points: r.points,
        reason: r.reason, rule_id: r.ruleId, shop_item_id: r.shopItemId, created_at: r.createdAt,
    })));
    // Update student totals
    await Promise.all(studentUpdates.map(u =>
        supabase.from('students').update({ total_points: u.totalPoints, available_points: u.availablePoints }).eq('id', u.id)
    ));
}

export async function dbRedeemItem(
    studentId: string, availablePoints: number,
    shopItemId: string, sold: number,
    record: PointRecord,
) {
    await supabase.from('point_records').insert({
        id: record.id, student_id: record.studentId, type: 'redeem', points: record.points,
        reason: record.reason, shop_item_id: record.shopItemId, created_at: record.createdAt,
    });
    await supabase.from('students').update({ available_points: availablePoints }).eq('id', studentId);
    await supabase.from('shop_items').update({ sold }).eq('id', shopItemId);
}

export async function dbResetPoints() {
    await supabase.from('point_records').delete().neq('id', '');
    // Reset all students
    const { data } = await supabase.from('students').select('id');
    if (data && data.length > 0) {
        await supabase.from('students')
            .update({ total_points: 0, available_points: 0 })
            .in('id', data.map((r: { id: string }) => r.id));
    }
}
