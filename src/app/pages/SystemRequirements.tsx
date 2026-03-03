import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { FileText, Filter, ChevronDown, ChevronRight } from 'lucide-react';

export type RequirementPriority = 'high' | 'medium' | 'low';
export type RequirementStatus = 'draft' | 'review' | 'approved' | 'implemented';

export interface SystemRequirement {
  id: string;
  description: string;
  priority: RequirementPriority;
  status: RequirementStatus;
}

const MOCK_REQUIREMENTS: SystemRequirement[] = [
  { id: 'REQ-001', description: '系统应支持用户登录与身份验证', priority: 'high', status: 'approved' },
  { id: 'REQ-002', description: '系统应提供多语言界面切换功能', priority: 'medium', status: 'review' },
  { id: 'REQ-003', description: '系统应支持批量导入导出数据', priority: 'high', status: 'implemented' },
  { id: 'REQ-004', description: '系统应支持移动端响应式布局', priority: 'high', status: 'implemented' },
  { id: 'REQ-005', description: '系统应提供数据可视化报表', priority: 'medium', status: 'review' },
  { id: 'REQ-006', description: '系统应支持权限角色管理', priority: 'high', status: 'draft' },
  { id: 'REQ-007', description: '系统应支持操作日志记录与审计', priority: 'medium', status: 'approved' },
  { id: 'REQ-008', description: '系统应支持主题切换（亮色/暗色）', priority: 'low', status: 'draft' },
  { id: 'REQ-009', description: '系统应支持离线缓存与同步', priority: 'low', status: 'draft' },
  { id: 'REQ-010', description: '系统应支持 API 接口文档自动生成', priority: 'medium', status: 'implemented' },
];

const PRIORITY_LABELS: Record<RequirementPriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const STATUS_LABELS: Record<RequirementStatus, string> = {
  draft: '草稿',
  review: '审核中',
  approved: '已通过',
  implemented: '已实现',
};

const PRIORITY_VARIANTS: Record<RequirementPriority, 'destructive' | 'default' | 'secondary'> = {
  high: 'destructive',
  medium: 'default',
  low: 'secondary',
};

const STATUS_COLORS: Record<RequirementStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  review: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  implemented: 'bg-blue-100 text-blue-800 border-blue-200',
};

export default function SystemRequirements() {
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const filteredRequirements = useMemo(() => {
    return MOCK_REQUIREMENTS.filter((r) => {
      const matchPriority = priorityFilter === 'all' || r.priority === priorityFilter;
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchPriority && matchStatus;
    });
  }, [priorityFilter, statusFilter]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            系统需求概览
          </h1>
          <p className="text-sm text-gray-500 mt-1">查看与管理系统需求条目</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'table' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            表格视图
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'card' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            卡片视图
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            筛选
          </CardTitle>
          <CardDescription>按优先级与状态过滤需求</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-gray-500 mb-1 block">优先级</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-gray-500 mb-1 block">状态</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="review">审核中</SelectItem>
                  <SelectItem value="approved">已通过</SelectItem>
                  <SelectItem value="implemented">已实现</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">总需求数</p>
            <p className="text-2xl font-semibold text-gray-900">{filteredRequirements.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">高优先级</p>
            <p className="text-2xl font-semibold text-red-600">
              {filteredRequirements.filter((r) => r.priority === 'high').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">已实现</p>
            <p className="text-2xl font-semibold text-blue-600">
              {filteredRequirements.filter((r) => r.status === 'implemented').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">审核中</p>
            <p className="text-2xl font-semibold text-amber-600">
              {filteredRequirements.filter((r) => r.status === 'review').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content: Table or Card view */}
      {viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead className="min-w-[100px]">ID</TableHead>
                    <TableHead className="min-w-[200px]">描述</TableHead>
                    <TableHead className="min-w-[90px]">优先级</TableHead>
                    <TableHead className="min-w-[90px]">状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequirements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        暂无匹配的需求
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequirements.map((req) => {
                      const isExpanded = expandedIds.has(req.id);
                      return (
                        <React.Fragment key={req.id}>
                          <TableRow
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleExpand(req.id)}
                          >
                            <TableCell>
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm">{req.id}</TableCell>
                            <TableCell className="max-w-md truncate">{req.description}</TableCell>
                            <TableCell>
                              <Badge variant={PRIORITY_VARIANTS[req.priority]}>
                                {PRIORITY_LABELS[req.priority]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${STATUS_COLORS[req.status]}`}
                              >
                                {STATUS_LABELS[req.status]}
                              </span>
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow>
                              <TableCell colSpan={5} className="bg-gray-50/50">
                                <div className="py-2 px-4 text-sm text-gray-600">
                                  <strong>完整描述：</strong> {req.description}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequirements.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center text-gray-500">暂无匹配的需求</CardContent>
            </Card>
          ) : (
            filteredRequirements.map((req) => (
              <Card key={req.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-mono">{req.id}</CardTitle>
                    <Badge variant={PRIORITY_VARIANTS[req.priority]}>{PRIORITY_LABELS[req.priority]}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{req.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${STATUS_COLORS[req.status]}`}
                  >
                    {STATUS_LABELS[req.status]}
                  </span>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
