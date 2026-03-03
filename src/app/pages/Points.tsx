import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Minus, Check, X, Users, Zap, ChevronDown } from 'lucide-react';

export default function Points() {
  const { students, groups, rules, applyPoints, getGroupById } = useApp();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'earn' | 'deduct'>('earn');
  const [customPoints, setCustomPoints] = useState('');
  const [reason, setReason] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const filteredStudents = students.filter(s => {
    const matchGroup = filterGroup === '' ? true : filterGroup === 'none' ? !s.groupId : s.groupId === filterGroup;
    const matchSearch = search === '' || s.name.includes(search);
    return matchGroup && matchSearch;
  });

  const toggleStudent = (id: string) => {
    setSelectedIds(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const selectAll = () => setSelectedIds(new Set(filteredStudents.map(s => s.id)));
  const clearAll = () => setSelectedIds(new Set());

  const applyRule = (rule: typeof rules[0]) => {
    if (selectedIds.size === 0) return;
    const pts = rule.points > 0 ? rule.points : rule.points;
    applyPoints(Array.from(selectedIds), pts, rule.name, rule.id);
    showSuccess(`已为 ${selectedIds.size} 名学生应用规则「${rule.name}」(${rule.points > 0 ? '+' : ''}${rule.points} 分)`);
  };

  const applyCustom = () => {
    const pts = parseInt(customPoints);
    if (isNaN(pts) || pts <= 0 || selectedIds.size === 0 || !reason.trim()) return;
    const signedPts = mode === 'earn' ? pts : -pts;
    applyPoints(Array.from(selectedIds), signedPts, reason.trim());
    showSuccess(`已为 ${selectedIds.size} 名学生${mode === 'earn' ? '加' : '扣'} ${pts} 分`);
    setCustomPoints('');
    setReason('');
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const positiveRules = rules.filter(r => r.points > 0);
  const negativeRules = rules.filter(r => r.points < 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-gray-900">积分操作</h1>
        <p className="text-sm text-gray-500 mt-0.5">选择学生后，应用积分规则或自定义加减分</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <Check className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Student Selector */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-800 flex items-center gap-2"><Users className="w-4.5 h-4.5 text-indigo-500" /> 选择学生</h3>
            <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
              已选 {selectedIds.size} 人
            </span>
          </div>

          <select
            value={filterGroup}
            onChange={e => setFilterGroup(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            <option value="">全部学生</option>
            <option value="none">未分组</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>

          <div className="relative">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索姓名..."
              className="w-full border border-gray-200 rounded-lg pl-3 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={selectAll} className="flex-1 text-xs py-1.5 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">全选</button>
            <button onClick={clearAll} className="flex-1 text-xs py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">清除</button>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {filteredStudents.map(s => {
              const group = getGroupById(s.groupId || '');
              const isSelected = selectedIds.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleStudent(s.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-colors
                    ${isSelected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 hover:bg-gray-50'}`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                    ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                    {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                    style={{ backgroundColor: group?.color || '#9ca3af' }}>
                    {s.name.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400">{group?.name || '未分组'} · {s.availablePoints} 分可用</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Point Actions */}
        <div className="lg:col-span-3 space-y-4">
          {selectedIds.size === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              👈 请先在左侧选择一位或多位学生
            </div>
          )}

          {/* Quick Rules */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-gray-800 mb-3 flex items-center gap-2"><Zap className="w-4.5 h-4.5 text-amber-500" /> 快速应用规则</h3>

            {positiveRules.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-2">加分规则</p>
                <div className="flex flex-wrap gap-2">
                  {positiveRules.map(r => (
                    <button
                      key={r.id}
                      onClick={() => applyRule(r)}
                      disabled={selectedIds.size === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>{r.icon}</span>
                      <span>{r.name}</span>
                      <span className="text-emerald-500 font-medium">+{r.points}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {negativeRules.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">扣分规则</p>
                <div className="flex flex-wrap gap-2">
                  {negativeRules.map(r => (
                    <button
                      key={r.id}
                      onClick={() => applyRule(r)}
                      disabled={selectedIds.size === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>{r.icon}</span>
                      <span>{r.name}</span>
                      <span className="text-red-500 font-medium">{r.points}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {rules.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">暂无积分规则，请在「积分规则」页面添加</p>
            )}
          </div>

          {/* Custom Points */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-gray-800 mb-4">自定义积分</h3>

            {/* Mode Toggle */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-4 w-fit">
              <button
                onClick={() => setMode('earn')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm transition-colors ${mode === 'earn' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Plus className="w-4 h-4" /> 加分
              </button>
              <button
                onClick={() => setMode('deduct')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm transition-colors ${mode === 'deduct' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Minus className="w-4 h-4" /> 扣分
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">积分数量 *</label>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-semibold ${mode === 'earn' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {mode === 'earn' ? '+' : '-'}
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={customPoints}
                    onChange={e => setCustomPoints(e.target.value)}
                    placeholder="输入分数"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <span className="text-sm text-gray-400">分</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">原因 *</label>
                <input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyCustom()}
                  placeholder="填写加减分原因..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <button
                onClick={applyCustom}
                disabled={selectedIds.size === 0 || !customPoints || parseInt(customPoints) <= 0 || !reason.trim()}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                  ${mode === 'earn' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
              >
                {mode === 'earn' ? '确认加分' : '确认扣分'}
                {selectedIds.size > 0 && ` (${selectedIds.size} 人)`}
              </button>
            </div>
          </div>

          {/* Selected Preview */}
          {selectedIds.size > 0 && (
            <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-4">
              <p className="text-xs text-indigo-500 mb-2">已选学生预览</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedIds).map(id => {
                  const s = students.find(st => st.id === id);
                  if (!s) return null;
                  const group = getGroupById(s.groupId || '');
                  return (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs text-gray-700 border border-indigo-100">
                      <span className="w-4 h-4 rounded-full text-white flex items-center justify-center text-xs" style={{ backgroundColor: group?.color || '#9ca3af', fontSize: '10px' }}>
                        {s.name.slice(0, 1)}
                      </span>
                      {s.name}
                      <button onClick={() => toggleStudent(id)} className="text-gray-400 hover:text-red-500 ml-0.5">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
