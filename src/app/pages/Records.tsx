import React, { useState, useMemo } from 'react';
import { useApp, RecordType } from '../context/AppContext';
import { Search, Filter, TrendingUp, TrendingDown, ShoppingBag, Calendar } from 'lucide-react';

const TYPE_LABELS: Record<RecordType, string> = { earn: '加分', deduct: '扣分', redeem: '兑换' };
const TYPE_COLORS: Record<RecordType, string> = {
  earn: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  deduct: 'text-red-600 bg-red-50 border-red-200',
  redeem: 'text-purple-600 bg-purple-50 border-purple-200',
};
const TYPE_ICONS: Record<RecordType, React.ReactNode> = {
  earn: <TrendingUp className="w-3.5 h-3.5" />,
  deduct: <TrendingDown className="w-3.5 h-3.5" />,
  redeem: <ShoppingBag className="w-3.5 h-3.5" />,
};

export default function Records() {
  const { records, students, rules, getStudentById, getGroupById } = useApp();
  const [filterType, setFilterType] = useState<RecordType | ''>('');
  const [filterStudent, setFilterStudent] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const sorted = useMemo(() => {
    return [...records]
      .filter(r => {
        const s = getStudentById(r.studentId);
        const matchType = filterType === '' || r.type === filterType;
        const matchStudent = filterStudent === '' || r.studentId === filterStudent;
        const matchSearch = search === '' || r.reason.includes(search) || s?.name.includes(search);
        return matchType && matchStudent && matchSearch;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [records, filterType, filterStudent, search]);

  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Stats
  const stats = useMemo(() => ({
    earn: records.filter(r => r.type === 'earn').reduce((s, r) => s + r.points, 0),
    deduct: records.filter(r => r.type === 'deduct').reduce((s, r) => s + r.points, 0),
    redeem: records.filter(r => r.type === 'redeem').reduce((s, r) => s + r.points, 0),
    total: records.length,
  }), [records]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-gray-900">积分记录</h1>
        <p className="text-sm text-gray-500 mt-0.5">所有积分变动的历史记录</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-400 mt-0.5">总记录数</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 text-center">
          <p className="text-2xl font-semibold text-emerald-700">+{stats.earn}</p>
          <p className="text-xs text-emerald-500 mt-0.5">累计加分</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-center">
          <p className="text-2xl font-semibold text-red-700">-{stats.deduct}</p>
          <p className="text-xs text-red-500 mt-0.5">累计扣分</p>
        </div>
        <div className="bg-purple-50 rounded-xl border border-purple-100 p-4 text-center">
          <p className="text-2xl font-semibold text-purple-700">{stats.redeem}</p>
          <p className="text-xs text-purple-500 mt-0.5">累计兑换</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="搜索原因或学生..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div className="flex gap-2">
          {(['', 'earn', 'deduct', 'redeem'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setFilterType(t); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors
                ${filterType === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {t === '' ? '全部' : (
                <><span className="flex items-center gap-1">{TYPE_ICONS[t as RecordType]} {TYPE_LABELS[t as RecordType]}</span></>
              )}
            </button>
          ))}
        </div>

        <select
          value={filterStudent}
          onChange={e => { setFilterStudent(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        >
          <option value="">全部学生</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">时间</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">学生</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">类型</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">原因</th>
              <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">积分变动</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.map(rec => {
              const student = getStudentById(rec.studentId);
              const group = student ? getGroupById(student.groupId || '') : null;
              return (
                <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(rec.createdAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                        style={{ backgroundColor: group?.color || '#9ca3af' }}>
                        {student?.name.slice(0, 1) || '?'}
                      </div>
                      <div>
                        <p className="text-sm text-gray-800">{student?.name || '未知学生'}</p>
                        {group && <p className="text-xs text-gray-400">{group.name}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${TYPE_COLORS[rec.type]}`}>
                      {TYPE_ICONS[rec.type]}
                      {TYPE_LABELS[rec.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700">{rec.reason}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-semibold ${rec.type === 'earn' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {rec.type === 'earn' ? '+' : '-'}{rec.points}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {paginated.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">暂无匹配记录</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>共 {sorted.length} 条记录</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">上一页</button>
            <span className="text-gray-600">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">下一页</button>
          </div>
        </div>
      )}
    </div>
  );
}
