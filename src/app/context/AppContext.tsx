import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  fetchAll, rowToStudent, rowToGroup, rowToRule, rowToShopItem, rowToRecord,
  dbAddStudent, dbUpdateStudent, dbDeleteStudent, dbDeleteStudents, dbAssignGroup, dbImportStudents,
  dbAddGroup, dbUpdateGroup, dbDeleteGroup,
  dbAddRule, dbUpdateRule, dbDeleteRule,
  dbAddShopItem, dbUpdateShopItem, dbDeleteShopItem,
  dbApplyPoints, dbRedeemItem, dbResetPoints,
} from '../../lib/db';

// ── Types ────────────────────────────────────────────────────────

export interface Student {
  id: string;
  name: string;
  gender?: string;
  studentId?: string;
  groupId: string | null;
  totalPoints: number;
  availablePoints: number;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  color: string;
}

export interface PointRule {
  id: string;
  name: string;
  points: number;
  icon: string;
}

export interface PointRecord {
  id: string;
  studentId: string;
  type: 'earn' | 'deduct' | 'redeem';
  points: number;
  reason: string;
  ruleId?: string;
  shopItemId?: string;
  createdAt: string;
}

export interface ShopItem {
  id: string;
  name: string;
  requiredPoints: number;
  stock: number;
  description: string;
  sold: number;
}

export interface AppState {
  students: Student[];
  groups: Group[];
  rules: PointRule[];
  shopItems: ShopItem[];
  records: PointRecord[];
}

// ── Context type ─────────────────────────────────────────────────

interface AppContextType extends AppState {
  isLoading: boolean;
  dbError: string | null;
  // Student ops
  addStudent: (name: string, groupId: string | null) => void;
  updateStudent: (id: string, name: string, groupId: string | null) => void;
  deleteStudent: (id: string) => void;
  deleteStudents: (ids: string[]) => void;
  assignGroup: (ids: string[], groupId: string | null) => void;
  importStudents: (rows: { name: string; gender?: string; studentId?: string }[], groupId: string | null) => number;
  // Group ops
  addGroup: (name: string, color: string) => void;
  updateGroup: (id: string, name: string, color: string) => void;
  deleteGroup: (id: string) => void;
  // Rule ops
  addRule: (name: string, points: number, icon: string) => void;
  updateRule: (id: string, name: string, points: number, icon: string) => void;
  deleteRule: (id: string) => void;
  // Point ops
  applyPoints: (studentIds: string[], points: number, reason: string, ruleId?: string) => void;
  redeemItem: (studentId: string, shopItemId: string) => { success: boolean; message: string };
  resetPoints: () => void;
  // Shop ops
  addShopItem: (name: string, requiredPoints: number, stock: number, description: string) => void;
  updateShopItem: (id: string, name: string, requiredPoints: number, stock: number, description: string) => void;
  deleteShopItem: (id: string) => void;
  // Helpers
  getStudentById: (id: string) => Student | undefined;
  getGroupById: (id: string) => Group | undefined;
  getGroupTotalPoints: (groupId: string) => number;
}

// ── Helpers ──────────────────────────────────────────────────────

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

const EMPTY_STATE: AppState = { students: [], groups: [], rules: [], shopItems: [], records: [] };

// ── Context ──────────────────────────────────────────────────────

const AppContext = createContext<AppContextType>({} as AppContextType);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // ── Initial load ──────────────────────────────────────────────
  useEffect(() => {
    fetchAll()
      .then(data => { setState(data); setIsLoading(false); })
      .catch(err => { setDbError(err.message); setIsLoading(false); });
  }, []);

  // ── Realtime subscription ─────────────────────────────────────
  useEffect(() => {
    const channel = supabase.channel('realtime-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, async () => {
        const { data } = await supabase.from('students').select('*').order('created_at');
        setState(s => ({ ...s, students: (data ?? []).map(rowToStudent) }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, async () => {
        const { data } = await supabase.from('groups').select('*');
        setState(s => ({ ...s, groups: (data ?? []).map(rowToGroup) }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rules' }, async () => {
        const { data } = await supabase.from('rules').select('*');
        setState(s => ({ ...s, rules: (data ?? []).map(rowToRule) }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_items' }, async () => {
        const { data } = await supabase.from('shop_items').select('*');
        setState(s => ({ ...s, shopItems: (data ?? []).map(rowToShopItem) }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'point_records' }, async () => {
        const { data } = await supabase.from('point_records').select('*').order('created_at', { ascending: false });
        setState(s => ({ ...s, records: (data ?? []).map(rowToRecord) }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Student ops ───────────────────────────────────────────────

  const addStudent = useCallback((name: string, groupId: string | null) => {
    const s: Student = { id: uid(), name, groupId, totalPoints: 0, availablePoints: 0, createdAt: new Date().toISOString() };
    setState(prev => ({ ...prev, students: [...prev.students, s] }));
    dbAddStudent(s).catch(() => setState(prev => ({ ...prev, students: prev.students.filter(x => x.id !== s.id) })));
  }, []);

  const updateStudent = useCallback((id: string, name: string, groupId: string | null) => {
    setState(prev => ({ ...prev, students: prev.students.map(st => st.id === id ? { ...st, name, groupId } : st) }));
    dbUpdateStudent(id, name, groupId);
  }, []);

  const deleteStudent = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      students: prev.students.filter(st => st.id !== id),
      records: prev.records.filter(r => r.studentId !== id),
    }));
    dbDeleteStudent(id);
  }, []);

  const deleteStudents = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setState(prev => ({
      ...prev,
      students: prev.students.filter(st => !idSet.has(st.id)),
      records: prev.records.filter(r => !idSet.has(r.studentId)),
    }));
    dbDeleteStudents(ids);
  }, []);

  const assignGroup = useCallback((ids: string[], groupId: string | null) => {
    const idSet = new Set(ids);
    setState(prev => ({ ...prev, students: prev.students.map(st => idSet.has(st.id) ? { ...st, groupId } : st) }));
    dbAssignGroup(ids, groupId);
  }, []);

  const importStudents = useCallback((rows: { name: string; gender?: string; studentId?: string }[], groupId: string | null): number => {
    const newStudents: Student[] = rows.map(row => ({
      id: uid(), name: row.name.trim(), gender: row.gender, studentId: row.studentId,
      groupId, totalPoints: 0, availablePoints: 0, createdAt: new Date().toISOString(),
    }));
    setState(prev => ({ ...prev, students: [...prev.students, ...newStudents] }));
    dbImportStudents(newStudents);
    return newStudents.length;
  }, []);

  // ── Group ops ─────────────────────────────────────────────────

  const addGroup = useCallback((name: string, color: string) => {
    const g: Group = { id: uid(), name, color };
    setState(prev => ({ ...prev, groups: [...prev.groups, g] }));
    dbAddGroup(g);
  }, []);

  const updateGroup = useCallback((id: string, name: string, color: string) => {
    setState(prev => ({ ...prev, groups: prev.groups.map(g => g.id === id ? { ...g, name, color } : g) }));
    dbUpdateGroup(id, name, color);
  }, []);

  const deleteGroup = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.filter(g => g.id !== id),
      students: prev.students.map(st => st.groupId === id ? { ...st, groupId: null } : st),
    }));
    dbDeleteGroup(id);
  }, []);

  // ── Rule ops ──────────────────────────────────────────────────

  const addRule = useCallback((name: string, points: number, icon: string) => {
    const r: PointRule = { id: uid(), name, points, icon };
    setState(prev => ({ ...prev, rules: [...prev.rules, r] }));
    dbAddRule(r);
  }, []);

  const updateRule = useCallback((id: string, name: string, points: number, icon: string) => {
    setState(prev => ({ ...prev, rules: prev.rules.map(r => r.id === id ? { ...r, name, points, icon } : r) }));
    dbUpdateRule(id, name, points, icon);
  }, []);

  const deleteRule = useCallback((id: string) => {
    setState(prev => ({ ...prev, rules: prev.rules.filter(r => r.id !== id) }));
    dbDeleteRule(id);
  }, []);

  // ── Point ops ─────────────────────────────────────────────────

  const applyPoints = useCallback((studentIds: string[], points: number, reason: string, ruleId?: string) => {
    const now = new Date().toISOString();
    const isEarn = points > 0;
    const type: 'earn' | 'deduct' = isEarn ? 'earn' : 'deduct';
    const absPoints = Math.abs(points);

    const newRecords: PointRecord[] = studentIds.map(sid => ({
      id: uid(), studentId: sid, type, points: absPoints, reason, ruleId,
      createdAt: now,
    }));

    setState(prev => {
      const studentUpdates: { id: string; totalPoints: number; availablePoints: number }[] = [];
      const updatedStudents = prev.students.map(st => {
        if (!studentIds.includes(st.id)) return st;
        const totalPoints = isEarn ? st.totalPoints + absPoints : st.totalPoints;
        const availablePoints = isEarn
          ? st.availablePoints + absPoints
          : Math.max(0, st.availablePoints - absPoints);
        studentUpdates.push({ id: st.id, totalPoints, availablePoints });
        return { ...st, totalPoints, availablePoints };
      });
      dbApplyPoints(studentUpdates, newRecords);
      return { ...prev, students: updatedStudents, records: [...newRecords, ...prev.records] };
    });
  }, []);

  const redeemItem = useCallback((studentId: string, shopItemId: string): { success: boolean; message: string } => {
    const student = state.students.find(s => s.id === studentId);
    const item = state.shopItems.find(i => i.id === shopItemId);
    if (!student || !item) return { success: false, message: '学生或商品不存在' };
    if (student.availablePoints < item.requiredPoints) return { success: false, message: '可用积分不足' };
    if (item.stock !== -1 && item.stock <= 0) return { success: false, message: '商品库存不足' };

    const newAvail = student.availablePoints - item.requiredPoints;
    const newSold = item.sold + 1;
    const newStock = item.stock === -1 ? -1 : item.stock - 1;
    const record: PointRecord = {
      id: uid(), studentId, type: 'redeem', points: item.requiredPoints,
      reason: `兑换：${item.name}`, shopItemId, createdAt: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === studentId ? { ...s, availablePoints: newAvail } : s),
      shopItems: prev.shopItems.map(i => i.id === shopItemId ? { ...i, sold: newSold, stock: newStock } : i),
      records: [record, ...prev.records],
    }));
    dbRedeemItem(studentId, newAvail, shopItemId, newSold, record);
    return { success: true, message: `成功兑换「${item.name}」` };
  }, [state.students, state.shopItems]);

  const resetPoints = useCallback(() => {
    setState(prev => ({
      ...prev,
      students: prev.students.map(s => ({ ...s, totalPoints: 0, availablePoints: 0 })),
      records: [],
    }));
    dbResetPoints();
  }, []);

  // ── Shop ops ──────────────────────────────────────────────────

  const addShopItem = useCallback((name: string, requiredPoints: number, stock: number, description: string) => {
    const item: ShopItem = { id: uid(), name, requiredPoints, stock, description, sold: 0 };
    setState(prev => ({ ...prev, shopItems: [...prev.shopItems, item] }));
    dbAddShopItem(item);
  }, []);

  const updateShopItem = useCallback((id: string, name: string, requiredPoints: number, stock: number, description: string) => {
    setState(prev => ({ ...prev, shopItems: prev.shopItems.map(i => i.id === id ? { ...i, name, requiredPoints, stock, description } : i) }));
    dbUpdateShopItem(id, name, requiredPoints, stock, description);
  }, []);

  const deleteShopItem = useCallback((id: string) => {
    setState(prev => ({ ...prev, shopItems: prev.shopItems.filter(i => i.id !== id) }));
    dbDeleteShopItem(id);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────

  const getStudentById = useCallback((id: string) => state.students.find(s => s.id === id), [state.students]);
  const getGroupById = useCallback((id: string) => state.groups.find(g => g.id === id), [state.groups]);
  const getGroupTotalPoints = useCallback((groupId: string) =>
    state.students.filter(s => s.groupId === groupId).reduce((sum, s) => sum + s.totalPoints, 0),
    [state.students]);

  return (
    <AppContext.Provider value={{
      ...state, isLoading, dbError,
      addStudent, updateStudent, deleteStudent, deleteStudents, assignGroup, importStudents,
      addGroup, updateGroup, deleteGroup,
      addRule, updateRule, deleteRule,
      applyPoints, redeemItem, resetPoints,
      addShopItem, updateShopItem, deleteShopItem,
      getStudentById, getGroupById, getGroupTotalPoints,
    }}>
      {children}
    </AppContext.Provider>
  );
}
