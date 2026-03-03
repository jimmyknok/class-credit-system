import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp, Student } from '../context/AppContext';
import {
  Plus, Search, Edit2, Trash2, Upload, ChevronUp, ChevronDown,
  X, Check, Download, ChevronLeft, ChevronRight, AlertTriangle, FileText, Users
} from 'lucide-react';

const PAGE_SIZE = 10;

function Avatar({ name, color }: { name: string; color?: string }) {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
      style={{ backgroundColor: color || '#6366f1' }}>
      {name.slice(0, 1)}
    </div>
  );
}

/* ── 单个学生编辑弹窗 ── */
interface ModalProps {
  onClose: () => void;
  onSave: (name: string, groupId: string | null) => void;
  initial?: { name: string; groupId: string | null };
  title: string;
}

function StudentModal({ onClose, onSave, initial, title }: ModalProps) {
  const { groups } = useApp();
  const [name, setName] = useState(initial?.name || '');
  const [groupId, setGroupId] = useState<string | null>(initial?.groupId || null);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), groupId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3>{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">学生姓名 *</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="请输入学生姓名"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">所属小组</label>
            <select
              value={groupId || ''}
              onChange={e => setGroupId(e.target.value || null)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">无（未分组）</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">取消</button>
          <button onClick={handleSave} disabled={!name.trim()} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50">保存</button>
        </div>
      </div>
    </div>
  );
}

/* ── 导入弹窗（双 Tab） ── */
interface CsvRow { name: string; gender: string; studentId: string }

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  const startIdx = lines[0]?.match(/姓名|学生|name/i) ? 1 : 0;
  return lines.slice(startIdx).map(line => {
    const cols = line.split(',').map(c => c.trim());
    return { name: cols[0] || '', gender: cols[1] || '', studentId: cols[2] || '' };
  }).filter(r => r.name);
}

function downloadTemplate() {
  const content = '学生姓名,学生性别,学生学号\n张伟,男,20240001\n李娜,女,20240002';
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = '学生导入模板.csv'; a.click();
  URL.revokeObjectURL(url);
}

function ImportModal({ onClose }: { onClose: () => void }) {
  const { groups, importStudents } = useApp();
  const [tab, setTab] = useState<'text' | 'csv'>('text');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [result, setResult] = useState<number | null>(null);

  // Tab 1: 文字批量输入
  const [text, setText] = useState('');

  // Tab 2: CSV 上传
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [csvError, setCsvError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setCsvError('');
    const reader = new FileReader();
    reader.onload = ev => {
      const parsed = parseCsv(ev.target?.result as string);
      if (parsed.length === 0) { setCsvError('未能解析到有效数据，请检查文件格式。'); setRows([]); }
      else setRows(parsed);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = () => {
    let count = 0;
    if (tab === 'text') {
      const names = text.split('\n').map(n => n.trim()).filter(Boolean);
      if (names.length === 0) return;
      count = importStudents(names.map(name => ({ name })), groupId);
    } else {
      if (rows.length === 0) return;
      count = importStudents(rows, groupId);
    }
    setResult(count);
  };

  const canImport = tab === 'text' ? text.trim().length > 0 : rows.length > 0;
  const textCount = text.split('\n').filter(n => n.trim()).length;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3>导入学生</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {result !== null ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-gray-800">成功导入 <span className="text-indigo-600 font-medium">{result}</span> 名学生</p>
            </div>
          ) : (
            <>
              {/* Tab 切换 */}
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                <button
                  onClick={() => setTab('text')}
                  className={`flex-1 py-2 text-sm transition-colors ${tab === 'text' ? 'bg-indigo-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  快速输入
                </button>
                <button
                  onClick={() => setTab('csv')}
                  className={`flex-1 py-2 text-sm transition-colors ${tab === 'csv' ? 'bg-indigo-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  CSV 上传
                </button>
              </div>

              {/* Tab 1 — 快速输入 */}
              {tab === 'text' && (
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">学生姓名列表（每行一个）</label>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={'张伟\n李娜\n王明\n...'}
                    rows={7}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">共 {textCount} 个姓名</p>
                </div>
              )}

              {/* Tab 2 — CSV 上传 */}
              {tab === 'csv' && (
                <>
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span>列 1-姓名，列 2-性别，列 3-学号</span>
                    </div>
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      <Download className="w-4 h-4" /> 下载模板
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1.5">选择 CSV 文件</label>
                    <div
                      className="border-2 border-dashed border-gray-200 rounded-xl px-6 py-7 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                      {fileName
                        ? <p className="text-sm text-indigo-600 font-medium">{fileName}</p>
                        : <p className="text-sm text-gray-400">点击选择或拖拽文件</p>
                      }
                      <p className="text-xs text-gray-300 mt-1">仅支持 .csv 格式</p>
                    </div>
                    <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
                    {csvError && <p className="text-xs text-red-500 mt-1.5">{csvError}</p>}
                  </div>

                  {rows.length > 0 && (
                    <div>
                      <label className="text-sm text-gray-700">解析预览（共 {rows.length} 条，显示前 5 条）</label>
                      <div className="border border-gray-100 rounded-lg overflow-hidden mt-1.5">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="text-left px-3 py-2 text-gray-500 font-medium">姓名</th>
                              <th className="text-left px-3 py-2 text-gray-500 font-medium">性别</th>
                              <th className="text-left px-3 py-2 text-gray-500 font-medium">学号</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {rows.slice(0, 5).map((r, i) => (
                              <tr key={i}>
                                <td className="px-3 py-2 text-gray-800">{r.name}</td>
                                <td className="px-3 py-2 text-gray-500">{r.gender || '-'}</td>
                                <td className="px-3 py-2 text-gray-500">{r.studentId || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 小组分配（两个 Tab 共用） */}
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">批量分配小组（可选）</label>
                <select
                  value={groupId || ''}
                  onChange={e => setGroupId(e.target.value || null)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="">无（未分组）</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            {result !== null ? '关闭' : '取消'}
          </button>
          {result === null && (
            <button
              onClick={handleImport}
              disabled={!canImport}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {tab === 'text'
                ? `确认导入${textCount > 0 ? ` (${textCount} 人)` : ''}`
                : `确认导入${rows.length > 0 ? ` (${rows.length} 条)` : ''}`
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 批量指派小组弹窗 ── */
function AssignGroupModal({ count, onClose, onConfirm }: { count: number; onClose: () => void; onConfirm: (groupId: string | null) => void }) {
  const { groups } = useApp();
  const [groupId, setGroupId] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-gray-900">批量指派小组</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">为已选的 <span className="text-indigo-600 font-semibold">{count}</span> 名学生指派小组：</p>
        <select
          value={groupId || ''}
          onChange={e => setGroupId(e.target.value || null)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-5"
        >
          <option value="">无（取消分组）</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">取消</button>
          <button onClick={() => onConfirm(groupId)} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
            确认指派
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 主页面 ── */
export default function Students() {
  const { students, groups, deleteStudent, deleteStudents, assignGroup, addStudent, updateStudent, getGroupById } = useApp();
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'totalPoints' | 'availablePoints'>('totalPoints');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [modal, setModal] = useState<null | 'add' | 'edit' | 'import' | 'delete' | 'bulkDelete' | 'assignGroup'>(null);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = students.filter(s => {
      const matchSearch = s.name.includes(search);
      const matchGroup = filterGroup === '' || (filterGroup === 'none' ? !s.groupId : s.groupId === filterGroup);
      return matchSearch && matchGroup;
    });
    list = list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'totalPoints') cmp = a.totalPoints - b.totalPoints;
      else cmp = a.availablePoints - b.availablePoints;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [students, search, filterGroup, sortBy, sortDir]);

  useEffect(() => { setPage(1); }, [search, filterGroup, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedStudents = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 inline ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 inline ml-0.5" />;
  };

  const toggleSelect = (id: string) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const selectAll = () => setSelected(new Set(filtered.map(s => s.id)));
  const clearSelect = () => setSelected(new Set());

  const rankedStudents = [...students].sort((a, b) => b.totalPoints - a.totalPoints);
  const getRank = (id: string) => rankedStudents.findIndex(s => s.id === id) + 1;

  const handleBulkDelete = () => {
    deleteStudents([...selected]);
    clearSelect();
    setModal(null);
  };

  const handleAssignGroup = (groupId: string | null) => {
    assignGroup([...selected], groupId);
    clearSelect();
    setModal(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">学生管理</h1>
          <p className="text-sm text-gray-500 mt-0.5">共 {students.length} 名学生</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal('import')} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4" /> 导入学生
          </button>
          <button onClick={() => setModal('add')} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> 添加学生
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索学生姓名..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <select
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        >
          <option value="">全部小组</option>
          <option value="none">未分组</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2.5">
          <span className="text-sm text-indigo-700 font-medium">已选 {selected.size} 名学生</span>
          <button onClick={clearSelect} className="text-sm text-indigo-400 hover:text-indigo-600">取消选择</button>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setModal('assignGroup')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
            >
              <Users className="w-3.5 h-3.5" /> 指派小组
            </button>
            <button
              onClick={() => setModal('bulkDelete')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> 删除已选
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && filtered.every(s => selected.has(s.id))}
                  onChange={e => e.target.checked ? selectAll() : clearSelect()}
                  className="rounded"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium w-10">排名</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">
                <button onClick={() => toggleSort('name')} className="hover:text-gray-700">姓名 <SortIcon col="name" /></button>
              </th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">小组</th>
              <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">
                <button onClick={() => toggleSort('totalPoints')} className="hover:text-gray-700">总积分 <SortIcon col="totalPoints" /></button>
              </th>
              <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">
                <button onClick={() => toggleSort('availablePoints')} className="hover:text-gray-700">可用积分 <SortIcon col="availablePoints" /></button>
              </th>
              <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pagedStudents.map(student => {
              const group = getGroupById(student.groupId || '');
              const rank = getRank(student.id);
              return (
                <tr key={student.id} className={`hover:bg-gray-50 transition-colors ${selected.has(student.id) ? 'bg-indigo-50/40' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(student.id)} onChange={() => toggleSelect(student.id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${rank === 1 ? 'text-amber-500' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-orange-400' : 'text-gray-400'}`}>
                      {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={student.name} color={group?.color} />
                      <div>
                        <span className="text-sm text-gray-800">{student.name}</span>
                        {student.studentId && <span className="block text-xs text-gray-400">{student.studentId}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {group ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: group.color }}>
                        {group.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">未分组</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-gray-900">{student.totalPoints}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-medium ${student.availablePoints > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>{student.availablePoints}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditing(student); setModal('edit'); }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setDeleting(student); setModal('delete'); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            {search || filterGroup ? '未找到匹配的学生' : '暂无学生数据，请先添加学生'}
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              共 {filtered.length} 条，第 {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} 条
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`e${i}`} className="px-1 text-gray-400 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${page === p ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'add' && (
        <StudentModal title="添加学生" onClose={() => setModal(null)} onSave={(name, groupId) => addStudent(name, groupId)} />
      )}
      {modal === 'edit' && editing && (
        <StudentModal
          title="编辑学生"
          initial={editing}
          onClose={() => { setModal(null); setEditing(null); }}
          onSave={(name, groupId) => updateStudent(editing.id, name, groupId)}
        />
      )}
      {modal === 'import' && <ImportModal onClose={() => setModal(null)} />}

      {/* 批量指派小组 */}
      {modal === 'assignGroup' && (
        <AssignGroupModal
          count={selected.size}
          onClose={() => setModal(null)}
          onConfirm={handleAssignGroup}
        />
      )}

      {/* 单个删除 */}
      {modal === 'delete' && deleting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-gray-900 mb-2">删除学生</h3>
            <p className="text-sm text-gray-600 mb-5">确定要删除「{deleting.name}」吗？该学生的所有积分记录也将一并删除，此操作不可恢复。</p>
            <div className="flex gap-2">
              <button onClick={() => { setModal(null); setDeleting(null); }} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">取消</button>
              <button onClick={() => { deleteStudent(deleting.id); setModal(null); setDeleting(null); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">确认删除</button>
            </div>
          </div>
        </div>
      )}

      {/* 批量删除 */}
      {modal === 'bulkDelete' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-gray-900">批量删除学生</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              确定要删除已选的 <span className="text-red-600 font-semibold">{selected.size}</span> 名学生吗？所有积分记录也将一并删除，<span className="font-medium">此操作不可恢复</span>。
            </p>
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">取消</button>
              <button onClick={handleBulkDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
                确认删除 ({selected.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
