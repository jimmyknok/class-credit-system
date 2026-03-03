import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Upload, AlertTriangle, Check, X, Database, FileText, Settings as SettingsIcon } from 'lucide-react';

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(data: object, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Settings() {
  const { students, groups, rules, records, shopItems, resetPoints, getGroupById } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetDone, setResetDone] = useState(false);

  const handleExportStudents = () => {
    const header = '姓名,小组,总积分,可用积分';
    const rows = students.map(s => {
      const g = getGroupById(s.groupId || '');
      return `${s.name},${g?.name || '未分组'},${s.totalPoints},${s.availablePoints}`;
    });
    downloadCSV([header, ...rows].join('\n'), `学生积分报表_${new Date().toLocaleDateString('zh-CN')}.csv`);
  };

  const handleExportRecords = () => {
    const header = '时间,学生,小组,类型,积分,原因';
    const typeMap: Record<string, string> = { earn: '加分', deduct: '扣分', redeem: '兑换' };
    const rows = [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(r => {
      const s = students.find(st => st.id === r.studentId);
      const g = s ? getGroupById(s.groupId || '') : null;
      const time = new Date(r.createdAt).toLocaleString('zh-CN');
      return `${time},${s?.name || '未知'},${g?.name || '未分组'},${typeMap[r.type] || r.type},${r.type === 'earn' ? '+' : '-'}${r.points},${r.reason}`;
    });
    downloadCSV([header, ...rows].join('\n'), `积分记录_${new Date().toLocaleDateString('zh-CN')}.csv`);
  };

  const handleExportRules = () => {
    downloadJSON({ rules, exportedAt: new Date().toISOString() }, `积分规则_${new Date().toLocaleDateString('zh-CN')}.json`);
  };

  const handleExportAll = () => {
    downloadJSON({ students, groups, rules, records, shopItems, exportedAt: new Date().toISOString() }, `班级数据备份_${new Date().toLocaleDateString('zh-CN')}.json`);
  };

  const handleReset = () => {
    if (confirmText !== '确认清零') return;
    resetPoints();
    setConfirmReset(false);
    setConfirmText('');
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  };

  const totalRedeemed = shopItems.reduce((s, i) => s + i.sold, 0);
  const totalEarned = records.filter(r => r.type === 'earn').reduce((s, r) => s + r.points, 0);
  const totalDeducted = records.filter(r => r.type === 'deduct').reduce((s, r) => s + r.points, 0);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-gray-900">数据管理</h1>
        <p className="text-sm text-gray-500 mt-0.5">导入导出数据、查看统计信息和危险操作</p>
      </div>

      {resetDone && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <Check className="w-4 h-4" /> 所有学生积分已清零，记录已清除
        </div>
      )}

      {/* Data Overview */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-gray-800 mb-4 flex items-center gap-2"><Database className="w-4.5 h-4.5 text-indigo-500" /> 数据概览</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: '学生人数', value: students.length, unit: '人' },
            { label: '小组数量', value: groups.length, unit: '个' },
            { label: '积分规则', value: rules.length, unit: '条' },
            { label: '积分记录', value: records.length, unit: '条' },
            { label: '商店奖励', value: shopItems.length, unit: '件' },
            { label: '累计兑换', value: totalRedeemed, unit: '次' },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-xl font-semibold text-gray-900 mt-0.5">{item.value} <span className="text-xs font-normal text-gray-400">{item.unit}</span></p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-sm font-semibold text-emerald-600">+{totalEarned}</p>
            <p className="text-xs text-gray-400">累计加分</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-red-600">-{totalDeducted}</p>
            <p className="text-xs text-gray-400">累计扣分</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-purple-600">{totalRedeemed * (shopItems.reduce((s, i) => s + i.requiredPoints, 0) / Math.max(1, shopItems.length)) | 0}</p>
            <p className="text-xs text-gray-400">积分消耗估算</p>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-gray-800 mb-4 flex items-center gap-2"><Download className="w-4.5 h-4.5 text-indigo-500" /> 导出数据</h3>
        <div className="space-y-2.5">
          {[
            { label: '学生积分报表', desc: `${students.length} 名学生的姓名、小组、积分数据`, format: 'CSV', action: handleExportStudents },
            { label: '积分变动记录', desc: `共 ${records.length} 条加分/扣分/兑换记录`, format: 'CSV', action: handleExportRecords },
            { label: '积分规则配置', desc: `${rules.length} 条规则的名称和分值设置`, format: 'JSON', action: handleExportRules },
            { label: '完整数据备份', desc: '所有数据（学生、小组、规则、记录、商店）', format: 'JSON', action: handleExportAll },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={item.action}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap ml-3"
              >
                <Download className="w-3.5 h-3.5" />
                {item.format}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Import info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-gray-800 mb-3 flex items-center gap-2"><Upload className="w-4.5 h-4.5 text-indigo-500" /> 导入数据</h3>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex gap-2">
            <FileText className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-700 font-medium">批量导入学生名单</p>
              <p className="text-xs text-blue-600 mt-1">请前往「学生管理」页面，点击「批量导入」按钮，粘贴学生姓名列表（每行一个姓名）即可快速导入。</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-2">
          <div className="flex gap-2">
            <SettingsIcon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-700 font-medium">恢复备份数据</p>
              <p className="text-xs text-blue-600 mt-1">如需从 JSON 备份文件恢复所有数据，请刷新页面后在浏览器控制台中导入数据（功能开发中）。</p>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5">
        <h3 className="text-red-700 mb-4 flex items-center gap-2"><AlertTriangle className="w-4.5 h-4.5" /> 危险操作</h3>

        {!confirmReset ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-800">积分清零</p>
              <p className="text-xs text-gray-500 mt-1">将所有学生的总积分和可用积分清零，并清除所有积分记录。适用于学期末或阶段重置。此操作不可恢复。</p>
            </div>
            <button
              onClick={() => setConfirmReset(true)}
              className="flex-shrink-0 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              积分清零
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              此操作将清除 {students.length} 名学生的所有积分和 {records.length} 条记录，无法恢复！
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1.5">请输入「确认清零」以继续：</label>
              <input
                autoFocus
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="确认清零"
                className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setConfirmReset(false); setConfirmText(''); }} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5">
                <X className="w-4 h-4" /> 取消
              </button>
              <button
                onClick={handleReset}
                disabled={confirmText !== '确认清零'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" /> 执行清零
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">所有数据保存在本地浏览器中（localStorage）。清除浏览器缓存会导致数据丢失，建议定期导出备份。</p>
    </div>
  );
}
