import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    Send, Plus, Search, 
    Camera, AlertCircle,
    ArrowUpDown, SlidersHorizontal, ChevronDown, Check,
    GripVertical, Layout, Settings, MoreHorizontal,
    Zap, Users, Box, Package, Inbox, ClipboardList, FileText, Gauge, Tag, Code, Fingerprint, Webhook, Globe, UploadCloud, MapPin, Trash2, ChevronRight,
    Calendar, Clock, Paperclip, ExternalLink
} from 'lucide-react';
import { 
    useRequests, 
    useLocations, 
    useAssets, 
    useUsers, 
    useRequestSettings,
    useTeams,
    useChecklists,
    useCategories,
    useCategoriesByType
} from '../hooks/useData';
import type { Asset, Location, User } from '../types';
import { CreateWorkflowModal } from '../components/CreateWorkflowModal';
import { useWorkflows } from '../hooks/useWorkflows';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { RolesWorkspace } from '../components/RolesWorkspace';
import { AssetSettingsWorkspace } from '../components/AssetSettingsWorkspace';
import { TableEmptyState } from '../components/EmptyState';
import { PartsSettingsWorkspace } from '../components/PartsSettingsWorkspace';
import { WorkOrderSettingsWorkspace } from '../components/WorkOrderSettingsWorkspace';
import { PurchaseOrderSettingsWorkspace } from '../components/PurchaseOrderSettingsWorkspace';
import { MeterSettingsWorkspace } from '../components/MeterSettingsWorkspace';
import { TagSettingsWorkspace } from '../components/TagSettingsWorkspace';
import { AuthSettingsWorkspace } from '../components/AuthSettingsWorkspace';
import { WebhookSettingsWorkspace } from '../components/WebhookSettingsWorkspace';
import { PriorityBadge } from '../components/PriorityBadge';
import { AddCategoryModal } from '../components/AddCategoryModal';

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MobileRequests } from './MobileRequests';

export const RequestsPage = () => {
    const queryClient = useQueryClient();

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const getTenantCompany = () => {
        try {
            const orgStr = localStorage.getItem('organization');
            if (orgStr) {
                const org = JSON.parse(orgStr);
                if (org && org.name) return org.name;
            }
            if (user && user.organizations && user.organizations.length > 0) {
                return user.organizations[0].name;
            }
        } catch (e) {
            console.error("Error reading tenant organization", e);
        }
        return 'Juric';
    };
    const companyName = getTenantCompany();

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
    const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [filterLocationId, setFilterLocationId] = useState('All');

    const { data: requestsData, isLoading } = useRequests({
        search: debouncedSearch,
        status: selectedStatuses.join(','),
        assetId: selectedAssetIds.join(','),
        assigneeId: selectedAssigneeIds.join(','),
        locationId: filterLocationId !== 'All' ? filterLocationId : undefined,
        sortBy,
        sortOrder,
        limit: 1000
    });

    const { data: requestSettings } = useRequestSettings();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
    const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<{ field: string; value: any }[]>([]);

    // Detail Modal Form States
    const [detailTitle, setDetailTitle] = useState('');
    const [detailDescription, setDetailDescription] = useState('');
    const [detailPriority, setDetailPriority] = useState('NONE');
    const [detailStartDate, setDetailStartDate] = useState('');
    const [detailStartTime, setDetailStartTime] = useState('');
    const [detailDueDate, setDetailDueDate] = useState('');
    const [detailDueTime, setDetailDueTime] = useState('');
    const [detailCategory, setDetailCategory] = useState('');
    const [detailLocationId, setDetailLocationId] = useState('');
    const [detailAssetId, setDetailAssetId] = useState('');
    const [detailPrimaryWorkerId, setDetailPrimaryWorkerId] = useState('');
    const [detailAdditionalWorkerId, setDetailAdditionalWorkerId] = useState('');
    const [detailTeamId, setDetailTeamId] = useState('');
    const [detailChecklistId, setDetailChecklistId] = useState('');
    const [detailEstimatedDuration, setDetailEstimatedDuration] = useState('');
    const [detailSignatureRequired, setDetailSignatureRequired] = useState(false);
    const [detailImageUrl, setDetailImageUrl] = useState('');
    const [detailFileName, setDetailFileName] = useState('');
    const [chatMessage, setChatMessage] = useState('');
    const [requestComments, setRequestComments] = useState<Record<string, Array<{ id: string; text: string; sender: string; timestamp: Date }>>>({});

    const filterOptions = [
        { id: 'title', label: 'Title' },
        { id: 'asset', label: 'Asset' },
        { id: 'status', label: 'Status' },
        { id: 'submittedDate', label: 'Submitted Date' },
        { id: 'category', label: 'Category' },
        { id: 'submittedBy', label: 'Submitted By' },
        { id: 'priority', label: 'Priority' },
        { id: 'assignedTo', label: 'Assigned To' },
        { id: 'additionalWorkers', label: 'Additional Workers' },
        { id: 'team', label: 'Team' },
        { id: 'location', label: 'Location' }
    ];
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const reqId = searchParams.get('id');
        if (reqId) {
            setSelectedRequestId(reqId);
            setIsDetailModalOpen(true);
        }
    }, [searchParams]);

    const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
    const [isAssetFilterOpen, setIsAssetFilterOpen] = useState(false);
    const [assetSearchTerm, setAssetSearchTerm] = useState('');
    const [isAssigneeFilterOpen, setIsAssigneeFilterOpen] = useState(false);
    const [assigneeSearchTerm, setAssigneeSearchTerm] = useState('');
    const [isSortOpen, setIsSortOpen] = useState(false);
    
    // Portal & Branding States
    const [view, setView] = useState<'registry' | 'settings'>('registry');
    const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
    const [isCreatePortalModalOpen, setIsCreatePortalModalOpen] = useState(false);
    const [isCreateWorkflowModalOpen, setIsCreateWorkflowModalOpen] = useState(false);
    const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);

    // Categories Settings States
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    
    // Picker & Selection States
    const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
    const [tempSelectedLocationIds, setTempSelectedLocationIds] = useState<string[]>([]);
    const [includeSubLocations, setIncludeSubLocations] = useState(false);
    const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
    const [tempSelectedAssetIds, setTempSelectedAssetIds] = useState<string[]>([]);

    // Data Hooks
    const { data: locations = [] } = useLocations();
    const { data: assets = [] } = useAssets();
    const { data: categories = [] } = useCategories();
    const { data: teams = [] } = useTeams();
    const { data: checklists = [] } = useChecklists();
    const { data: woCategories = [], createCategory, updateCategory, deleteCategory } = useCategoriesByType('WORK_ORDER');

    // Selection Helpers
    const toggleTempLocation = (id: string) => {
        setTempSelectedLocationIds(prev => 
            prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id]
        );
    };

    const toggleTempAsset = (id: string) => {
        setTempSelectedAssetIds(prev => 
            prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
        );
    };
    const [portalFormData, setPortalFormData] = useState({
        name: '',
        customUrl: '',
        type: 'general', // general, location, asset
        options: {
            attachments: { enabled: true, required: false },
            location: { enabled: true, required: false },
            asset: { enabled: true, required: false }
        },
        customFields: [] as any[]
    });
    const [settingsTab, setSettingsTab] = useState<'internal' | 'legacy' | 'public' | 'automation' | 'purchaseorder' | 'categories' | 'meter' | 'tag'>('internal');
    const [activeSettingsSection, setActiveSettingsSection] = useState('Requests');
    const [showMobileSettingsMenu, setShowMobileSettingsMenu] = useState(true);
    const [language, setLanguage] = useState('English (US)');
    const [dateFormat, setDateFormat] = useState('MM/DD/YY');
    const [currency, setCurrency] = useState('USD ($) — US Dollar');
    const [timezone, setTimezone] = useState('Asia/Calcutta +05:30 IST');
    const [isColumnsOpen, setIsColumnsOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({
        image: true,
        asset: true,
        status: true,
        woStatus: true,
        submittedDate: true,
        category: true,
        submittedBy: true,
        priority: true,
        workOrder: true,
        assignedTo: true,
        additionalWorkers: true,
        team: true,
        location: true,
        tasks: true
    });

    const { workflows, deleteWorkflow, updateWorkflow } = useWorkflows();

    // Form State
    const [formData, setFormData] = useState({ title: '', description: '', locationId: '', assetId: '', priority: 'NONE' });

    const handleDeletePortal = (portalId: string) => {
        if (window.confirm('Are you sure you want to delete this Request Portal?')) {
            const updatedPortals = requestPortals.filter(p => p.id !== portalId);
            setRequestPortals(updatedPortals);
            updateSettings.mutate({ fieldSettings, formTasks, requestPortals: updatedPortals });
        }
    };

    const handleCreatePortal = () => {
        if (!portalFormData.name.trim() || !portalFormData.customUrl.trim()) {
            toast.error('Portal Name and Custom URL are required');
            return;
        }

        const formattedUrl = portalFormData.customUrl.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-');
        const newPortal = {
            id: Math.random().toString(36).substring(2, 9),
            name: portalFormData.name.trim(),
            customUrl: formattedUrl,
            type: portalFormData.type,
            options: portalFormData.options,
            customFields: portalFormData.customFields,
            createdAt: new Date().toISOString()
        };

        if (requestPortals.some(p => p.customUrl === newPortal.customUrl)) {
            toast.error('A portal with this custom URL already exists');
            return;
        }

        const updatedPortals = [...requestPortals, newPortal];
        setRequestPortals(updatedPortals);
        updateSettings.mutate({ fieldSettings, formTasks, requestPortals: updatedPortals }, {
            onSuccess: () => {
                setIsCreatePortalModalOpen(false);
                setPortalFormData({
                    name: '',
                    customUrl: '',
                    type: 'general',
                    options: {
                        attachments: { enabled: true, required: false },
                        location: { enabled: true, required: false },
                        asset: { enabled: true, required: false }
                    },
                    customFields: []
                });
                toast.success('Request portal created successfully');
            }
        });
    };
    const [taskResponses, setTaskResponses] = useState<Record<string, boolean>>({});

    const toggleTaskResponse = (taskId: string) => {
        setTaskResponses(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [fieldSettings, setFieldSettings] = useState<Record<string, { create: string, approve: string }>>({
        title: { create: 'Required', approve: 'Required' },
        description: { create: 'Optional', approve: 'Optional' },
        priority: { create: 'Optional', approve: 'Optional' },
        images: { create: 'Optional', approve: 'Optional' },
        dueDate: { create: 'Hidden', approve: 'Optional' },
        category: { create: 'Hidden', approve: 'Optional' },
        location: { create: 'Hidden', approve: 'Optional' },
        asset: { create: 'Hidden', approve: 'Optional' },
        worker: { create: 'Hidden', approve: 'Optional' },
        team: { create: 'Hidden', approve: 'Optional' },
        files: { create: 'Optional', approve: 'Optional' },
        additional: { create: 'Hidden', approve: 'Optional' },
        start: { create: 'Hidden', approve: 'Optional' },
        duration: { create: 'Hidden', approve: 'Optional' },
        checklists: { create: 'Hidden', approve: 'Optional' },
        signature: { create: 'Hidden', approve: 'Optional' }
    });
    const [formTasks, setFormTasks] = useState<Array<{ 
        id: string, 
        label: string, 
        type: string, 
        isRequired: boolean 
    }>>([]);
    

    const requests = Array.isArray(requestsData) ? requestsData : (requestsData as any)?.items || [];
    const totalRequests = (requestsData as any)?.total || requests.length;

    const PriorityWeights: Record<string, number> = {
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
        NONE: 0
    };

    const sortedRequests = useMemo(() => {
        let result = [...requests];
        
        // Advanced Filters
        if (activeFilters.length > 0) {
            result = result.filter((r: any) => {
                return activeFilters.every(f => {
                    if (!f.value) return true;
                    const val = f.value.toLowerCase();
                    switch (f.field) {
                        case 'Title': return (r.title || '').toLowerCase().includes(val);
                        case 'Asset': return (r.asset?.name || '').toLowerCase().includes(val);
                        case 'Status': return (r.status || '').toLowerCase().includes(val);
                        case 'Category': return (r.asset?.categoryRef?.name || '').toLowerCase().includes(val);
                        case 'Submitted By': return (r.requester?.user?.name || r.guestName || '').toLowerCase().includes(val);
                        case 'Priority': return (r.priority || '').toLowerCase().includes(val);
                        case 'Assigned To': return (r.workOrder?.assignedTo?.user?.name || '').toLowerCase().includes(val);
                        case 'Team': return (r.workOrder?.assignedTeam?.name || '').toLowerCase().includes(val);
                        case 'Location': return (r.location?.name || '').toLowerCase().includes(val);
                        case 'Additional Workers': return (r.workOrder?.technicians || []).some((w: any) => (w.user?.user?.name || '').toLowerCase().includes(val));
                        default: return true;
                    }
                });
            });
        }

        if (sortBy === 'priority') {
            result.sort((a, b) => {
                const weightA = PriorityWeights[a.priority?.toUpperCase() || 'NONE'] ?? 0;
                const weightB = PriorityWeights[b.priority?.toUpperCase() || 'NONE'] ?? 0;
                // For desc, we want highest weight first (weightB - weightA)
                return sortOrder === 'desc' ? weightB - weightA : weightA - weightB;
            });
        }
        
        return result;
    }, [requests, sortBy, sortOrder, activeFilters]);

    const { data: usersData } = useUsers();
    const users = (Array.isArray(usersData) ? usersData : (usersData as any)?.items || []) as User[];



    const [requestPortals, setRequestPortals] = useState<any[]>([]);
    const [portalSearchTerm, setPortalSearchTerm] = useState('');

    useEffect(() => {
        if (requestSettings?.fieldSettings) setFieldSettings(requestSettings.fieldSettings);
        if (requestSettings?.formTasks) setFormTasks(requestSettings.formTasks);
        if (requestSettings?.requestPortals) setRequestPortals(requestSettings.requestPortals);
    }, [requestSettings]);

    const { data: dbSettings } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const response = await api.get('/settings');
            return response.data;
        }
    });

    useEffect(() => {
        if (dbSettings && Array.isArray(dbSettings)) {
            const lang = dbSettings.find((s: any) => s.key === 'general.language')?.value;
            if (lang) setLanguage(lang);
            const df = dbSettings.find((s: any) => s.key === 'general.dateFormat')?.value;
            if (df) setDateFormat(df);
            const curr = dbSettings.find((s: any) => s.key === 'general.currency')?.value;
            if (curr) setCurrency(curr);
            const tz = dbSettings.find((s: any) => s.key === 'general.timezone')?.value;
            if (tz) setTimezone(tz);
        }
    }, [dbSettings]);

    const updateGeneralSettings = useMutation({
        mutationFn: async (settingsToSave: { key: string; value: string }[]) => {
            return Promise.all(
                settingsToSave.map(s => api.post('/settings', s))
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            toast.success('General Settings updated successfully');
            setView('registry');
        },
        onError: () => {
            toast.error('Failed to update General Settings');
        }
    });

    const updateSettings = useMutation({
        mutationFn: async (vars: any) => {
            const response = await api.patch('/requests/settings', vars);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['request-settings'] });
            toast.success('Configuration Synchronized with Registry');
            setView('registry');
        }
    });

    const createRequest = useMutation({
        mutationFn: async (vars: any) => {
            const data = new FormData();
            data.append('title', vars.title);
            
            // Append task responses to description
            let finalDescription = vars.description || '';
            const completedTasks = formTasks.filter(t => taskResponses[t.id]);
            if (completedTasks.length > 0) {
                finalDescription += '\n\n-- Additional Form Items --\n';
                completedTasks.forEach(t => {
                    finalDescription += `[x] ${t.label}\n`;
                });
                const pendingTasks = formTasks.filter(t => !taskResponses[t.id]);
                pendingTasks.forEach(t => {
                    finalDescription += `[ ] ${t.label}\n`;
                });
            }
            
            data.append('description', finalDescription);
            if (vars.locationId) data.append('locationId', vars.locationId);
            if (vars.assetId) data.append('assetId', vars.assetId);
            if (vars.priority) data.append('priority', vars.priority);
            if (selectedFile) data.append('file', selectedFile);

            const response = await api.post('/requests', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            setIsCreateModalOpen(false);
            setFormData({ title: '', description: '', locationId: '', assetId: '', priority: 'NONE' });
            setSelectedFile(null);
            toast.success('Signal Transmitted to Engineering');
        },
        onError: () => toast.error('Transmission Failed')
    });

    const approveRequest = useMutation({
        mutationFn: async ({ id, ...data }: any) => {
            const response = await api.post(`/requests/${id}/approve`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            toast.success('Dispatched: Work Order in Execution');
        }
    });

    const rejectRequest = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/requests/${id}/reject`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            toast.success('Signal Rejected: Data Pipeline Cleared');
        }
    });

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        if (searchParams.get('id')) {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('id');
            setSearchParams(newParams);
        }
    };

    const updateRequest = useMutation({
        mutationFn: async ({ id, ...data }: any) => {
            const response = await api.patch(`/requests/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            handleCloseDetailModal();
            toast.success('Request updated successfully');
        },
        onError: () => toast.error('Failed to update request')
    });

    const handleExportCSV = () => {
        if (!requests.length) return;
        const headers = ['Request #', 'Title', 'Description', 'Status', 'Priority', 'Location', 'Asset', 'Submitted Date'];
        const csvContent = [
            headers.join(','),
            ...requests.map((req: any) => [
                `"REQ-${req.id.split('-')[0].toUpperCase()}"`,
                `"${(req.title || '').replace(/"/g, '""')}"`,
                `"${(req.description || '').replace(/"/g, '""')}"`,
                `"${req.status}"`,
                `"${req.priority || 'NONE'}"`,
                `"${req.location?.name || 'N/A'}"`,
                `"${req.asset?.name || 'N/A'}"`,
                `"${req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `CMMS_Requests_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const selectedRequest = useMemo(() => {
        return requests.find((r: any) => r.id === selectedRequestId);
    }, [requests, selectedRequestId]);

    const currentUserRole = useMemo(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.role) return payload.role.toUpperCase();
            } catch (e) {}
        }
        const u = user;
        return (u?.roleName || u?.role || u?.organizations?.[0]?.roleName || (typeof u?.organizations?.[0]?.role === 'string' ? u.organizations[0].role : u?.organizations?.[0]?.role?.name) || '').toUpperCase();
    }, [user]);

    const isRestrictedRole = ['LIMITED TECHNICIAN', 'LIMITED_TECHNICIAN', 'REQUESTER', 'CUSTOMER DEPARTMENT MANAGER', 'CUSTOMER_DEPARTMENT_MANAGER'].includes(currentUserRole);
    const isReadOnly = selectedRequest?.status === 'APPROVED' || isRestrictedRole;

    const getInitials = (name: string) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(n => n.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    useEffect(() => {
        if (selectedRequest) {
            setDetailTitle(selectedRequest.title || '');
            setDetailDescription(selectedRequest.description || '');
            setDetailPriority(selectedRequest.priority || 'NONE');
            
            // Format dates
            const getLocalDateString = (isoStr: string) => {
                if (!isoStr) return '';
                const d = new Date(isoStr);
                if (isNaN(d.getTime())) return isoStr.split('T')[0] || '';
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const getLocalTimeString = (isoStr: string) => {
                if (!isoStr) return '';
                const d = new Date(isoStr);
                if (isNaN(d.getTime())) return isoStr.split('T')[1]?.slice(0, 5) || '';
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                return `${hours}:${minutes}`;
            };

            const startStr = selectedRequest.startDate || '';
            setDetailStartDate(getLocalDateString(startStr));
            setDetailStartTime(getLocalTimeString(startStr));

            const dueStr = selectedRequest.dueDate || selectedRequest.workOrder?.dueDate || '';
            setDetailDueDate(getLocalDateString(dueStr));
            setDetailDueTime(getLocalTimeString(dueStr));

            setDetailCategory(selectedRequest.asset?.categoryRef?.name || '');
            setDetailLocationId(selectedRequest.locationId || '');
            setDetailAssetId(selectedRequest.assetId || '');
            setDetailPrimaryWorkerId(selectedRequest.workOrder?.assignedToId || '');
            setDetailAdditionalWorkerId(selectedRequest.workOrder?.technicians?.[1]?.user?.userOrgId || '');
            setDetailTeamId(selectedRequest.workOrder?.assignedTeamId || '');
            setDetailChecklistId(selectedRequest.workOrder?.checklistId || '');
            setDetailEstimatedDuration(selectedRequest.estimatedDuration || '');
            setDetailSignatureRequired(selectedRequest.signatureRequired || false);
            setDetailImageUrl(selectedRequest.imageUrl || '');
            setDetailFileName('');

            // Populate system comments if approved/created and comments not already populated
            const reqId = selectedRequest.id;
            const senderName = selectedRequest.requester?.user?.name || selectedRequest.guestName || user?.name || 'evan mon';
            const creationTime = selectedRequest.createdAt ? new Date(selectedRequest.createdAt) : new Date();

            setRequestComments(prev => {
                const currentComments = prev[reqId] || [];
                const hasCreated = currentComments.some(c => c.id === `created-${reqId}`);
                const hasApproved = currentComments.some(c => c.id === `approved-${reqId}`);
                
                let updatedComments = [...currentComments];
                
                if (!hasCreated) {
                    updatedComments.unshift({
                        id: `created-${reqId}`,
                        text: `Request Created: ${selectedRequest.title}`,
                        sender: senderName,
                        timestamp: creationTime
                    });
                }
                
                if (selectedRequest.status === 'APPROVED' && !hasApproved) {
                    const createdIndex = updatedComments.findIndex(c => c.id === `created-${reqId}`);
                    const approvedComment = {
                        id: `approved-${reqId}`,
                        text: `Request Approved: ${selectedRequest.title}`,
                        sender: senderName,
                        timestamp: creationTime
                    };
                    if (createdIndex !== -1) {
                        updatedComments.splice(createdIndex + 1, 0, approvedComment);
                    } else {
                        updatedComments.push(approvedComment);
                    }
                }
                
                if (JSON.stringify(currentComments) === JSON.stringify(updatedComments)) {
                    return prev;
                }
                
                return {
                    ...prev,
                    [reqId]: updatedComments
                };
            });
        }
    }, [selectedRequest]);

    const getMergedISOString = (dateStr: string, timeStr: string) => {
        if (!dateStr) return undefined;
        const d = new Date(`${dateStr}T${timeStr || '00:00'}:00`);
        return !isNaN(d.getTime()) ? d.toISOString() : undefined;
    };

    const handleSendComment = () => {
        if (!chatMessage.trim() || !selectedRequestId) return;
        
        const newComment = {
            id: Math.random().toString(36).substr(2, 9),
            text: chatMessage.trim(),
            sender: 'You',
            timestamp: new Date()
        };

        setRequestComments(prev => ({
            ...prev,
            [selectedRequestId]: [...(prev[selectedRequestId] || []), newComment]
        }));
        setChatMessage('');
    };

    const getSortLabel = () => {
        switch (sortBy) {
            case 'title': return 'Title';
            case 'asset': return 'Asset';
            case 'category': return 'Category';
            case 'priority': return 'Priority';
            default: return 'Submitted Date';
        }
    };
    const isMobile = useMediaQuery('(max-width: 767px)');

    if (isMobile && view === 'registry') {
        return (
            <MobileRequests
                requests={requests}
                locations={locations}
                assets={assets}
                categories={categories}
                users={users}
                teams={teams}
                checklists={checklists}
                isLoading={isLoading}
                createRequest={createRequest}
                approveRequest={approveRequest}
                rejectRequest={rejectRequest}
                updateRequest={updateRequest}
                fieldSettings={fieldSettings}
                formTasks={formTasks}
                taskResponses={taskResponses}
                toggleTaskResponse={toggleTaskResponse}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                requestComments={requestComments}
                setRequestComments={setRequestComments}
                setView={(v) => {
                    setView(v);
                    if (v === 'settings') {
                        setShowMobileSettingsMenu(true);
                    }
                }}
                visibleColumns={visibleColumns}
                setVisibleColumns={setVisibleColumns}
                onExportCSV={handleExportCSV}
            />
        );
    }

    return (
        <div className="flex flex-col h-full bg-white animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0 bg-white">
                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                        <div className="w-5 h-5 flex flex-col gap-[3px]">
                            <div className="w-full h-[8px] border-2 border-gray-400 rounded-sm" />
                            <div className="w-full h-[8px] border-2 border-gray-400 rounded-sm" />
                        </div>
                    </button>
                     <h1 className="text-[20px] font-semibold text-gray-800">
                        {view === 'registry' ? 'Requests' : 'Request Settings'}
                     </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Plus className="w-5 h-5 text-indigo-100" />
                        Create Request
                    </button>
                    
                    <div className="relative">
                        <button 
                            onClick={() => setIsMoreActionsOpen(!isMoreActionsOpen)}
                            className="p-2.5 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-gray-600 border border-transparent hover:border-gray-200"
                        >
                            <MoreHorizontal className="w-6 h-6" />
                        </button>

                        <AnimatePresence>
                            {isMoreActionsOpen && (
                                <>
                                    <div className="fixed inset-0 z-[60]" onClick={() => setIsMoreActionsOpen(false)} />
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 z-[70] py-2 overflow-hidden"
                                    >
                                        <button 
                                            onClick={() => {
                                                setView('settings');
                                                setIsMoreActionsOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors group"
                                        >
                                            <Settings className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" />
                                            <span className="text-[15px] font-medium font-outfit">Edit Request Form</span>
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {view === 'registry' ? (
                <>
                    {/* Toolbar Row 1 */}
                    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white shrink-0 py-2">
                        <div className="text-sm font-medium text-gray-700 uppercase tracking-tighter italic">
                            <span className="font-black text-indigo-600 mr-1">{totalRequests}</span> Result{totalRequests !== 1 && 's'} Returned
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="relative">
                                <button 
                                    onClick={() => setIsSortOpen(!isSortOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">Sort: {getSortLabel()}</span>
                                </button>

                                <AnimatePresence>
                                    {isSortOpen && (
                                        <>
                                            <div className="fixed inset-0 z-[60]" onClick={() => setIsSortOpen(false)} />
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[70] py-2 overflow-hidden"
                                            >
                                                <div className="px-4 py-2 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Sort By</div>
                                                {[
                                                    { id: 'title', label: 'Title' },
                                                    { id: 'asset', label: 'Asset' },
                                                    { id: 'createdAt', label: 'Submitted Date' },
                                                    { id: 'category', label: 'Category' },
                                                    { id: 'priority', label: 'Priority' }
                                                ].map((option) => (
                                                    <button 
                                                        key={option.id}
                                                        onClick={() => { setSortBy(option.id); setIsSortOpen(false); }}
                                                        className="w-full flex items-center justify-between px-4 py-2 text-[14px] text-gray-700 hover:bg-gray-50 transition-colors"
                                                    >
                                                        {option.label}
                                                        {sortBy === option.id && <Check className="w-4 h-4 text-indigo-600" />}
                                                    </button>
                                                ))}
                                                <div className="my-2 border-t border-gray-100" />
                                                <div className="px-4 py-2 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Order</div>
                                                <button 
                                                    onClick={() => { setSortOrder('desc'); setIsSortOpen(false); }}
                                                    className="w-full flex items-center justify-between px-4 py-2 text-[14px] text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    Descending
                                                    {sortOrder === 'desc' && <Check className="w-4 h-4 text-indigo-600" />}
                                                </button>
                                                <button 
                                                    onClick={() => { setSortOrder('asc'); setIsSortOpen(false); }}
                                                    className="w-full flex items-center justify-between px-4 py-2 text-[14px] text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    Ascending
                                                    {sortOrder === 'asc' && <Check className="w-4 h-4 text-indigo-600" />}
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button 
                                onClick={() => setIsFiltersModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-700">Filters</span>
                            </button>

                            <div className="relative">
                                <button 
                                    onClick={() => setIsColumnsOpen(!isColumnsOpen)}
                                    className="flex items-center gap-2 hover:text-gray-900 font-medium transition-colors"
                                >
                                    <Layout className="w-4 h-4" />
                                    Columns
                                </button>

                                <AnimatePresence>
                                    {isColumnsOpen && (
                                        <>
                                            <div className="fixed inset-0 z-[60]" onClick={() => setIsColumnsOpen(false)} />
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                                                className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[70] py-2 overflow-hidden"
                                            >
                                                <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                                                    {[
                                                        { id: 'title', label: 'Title', locked: true },
                                                        { id: 'image', label: 'Image' },
                                                        { id: 'asset', label: 'Asset' },
                                                        { id: 'status', label: 'Status' },
                                                        { id: 'woStatus', label: 'Work Order Status' },
                                                        { id: 'submittedDate', label: 'Submitted Date' },
                                                        { id: 'category', label: 'Category' },
                                                        { id: 'submittedBy', label: 'Submitted By' },
                                                        { id: 'priority', label: 'Priority' },
                                                        { id: 'workOrder', label: 'Work Order' },
                                                        { id: 'assignedTo', label: 'Assigned To' },
                                                        { id: 'additionalWorkers', label: 'Additional Workers' },
                                                        { id: 'team', label: 'Team' },
                                                        { id: 'location', label: 'Location' },
                                                        { id: 'tasks', label: 'Tasks' }
                                                    ].map((col) => (
                                                        <div key={col.id} className={cn(
                                                            "flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors group",
                                                            col.locked && "opacity-40 grayscale pointer-events-none"
                                                        )}>
                                                            <GripVertical className="w-4 h-4 text-gray-300 cursor-grab active:cursor-grabbing" />
                                                            <input 
                                                                type="checkbox"
                                                                checked={col.locked || (visibleColumns as any)[col.id]}
                                                                onChange={() => setVisibleColumns({ ...visibleColumns, [col.id]: !(visibleColumns as any)[col.id] })}
                                                                className="w-4 h-4 rounded border-gray-100 text-indigo-600 focus:ring-0 cursor-pointer"
                                                            />
                                                            <span className="text-[14px] font-medium text-gray-700">{col.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="relative ml-2 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input 
                                    type="text"
                                    placeholder="Search requests..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-1.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all w-64 shadow-inner"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-100 shrink-0 py-2">
                        <div className="relative">
                            <button 
                                onClick={() => setIsAssetFilterOpen(!isAssetFilterOpen)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 bg-white border rounded-md text-sm font-medium transition-all shadow-sm",
                                    selectedAssetIds.length > 0 ? "border-indigo-600 text-indigo-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                <motion.div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center">
                                        <Plus className="w-2.5 h-2.5 text-gray-400" />
                                    </div>
                                    Asset
                                </motion.div>
                                {selectedAssetIds.length > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] rounded-full">
                                        {selectedAssetIds.length}
                                    </span>
                                )}
                                <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                            </button>

                            <AnimatePresence>
                                {isAssetFilterOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[60]" onClick={() => setIsAssetFilterOpen(false)} />
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[70] overflow-hidden"
                                        >
                                            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                                                <span className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Select Assets</span>
                                                <button onClick={() => setIsAssetFilterOpen(false)} className="text-slate-400 hover:text-slate-600">
                                                    <Plus className="w-4 h-4 rotate-45" />
                                                </button>
                                            </div>
                                            <div className="p-3">
                                                <div className="relative mb-3">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input 
                                                        autoFocus
                                                        type="text"
                                                        placeholder="Search assets"
                                                        value={assetSearchTerm}
                                                        onChange={(e) => setAssetSearchTerm(e.target.value)}
                                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1">
                                                    {assets?.filter((a: any) => a.name.toLowerCase().includes(assetSearchTerm.toLowerCase())).map((asset: any) => (
                                                        <label key={asset.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-xl cursor-pointer group transition-colors">
                                                            <input 
                                                                type="checkbox"
                                                                checked={selectedAssetIds.includes(asset.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedAssetIds([...selectedAssetIds, asset.id]);
                                                                    } else {
                                                                        setSelectedAssetIds(selectedAssetIds.filter(id => id !== asset.id));
                                                                    }
                                                                }}
                                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                            />
                                                            <span className="text-[13px] font-medium text-gray-700 group-hover:text-indigo-600 truncate">{asset.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="p-3 bg-gray-50 flex items-center justify-between">
                                                <button 
                                                    onClick={() => {
                                                        setSelectedAssetIds([]);
                                                        setAssetSearchTerm('');
                                                    }}
                                                    className="text-[13px] font-bold text-gray-400 hover:text-gray-600 ml-2"
                                                >
                                                    Clear
                                                </button>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => setIsAssetFilterOpen(false)}
                                                        className="px-4 py-1.5 text-[13px] font-bold text-gray-600 hover:bg-white rounded-lg transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        onClick={() => setIsAssetFilterOpen(false)}
                                                        className="px-4 py-1.5 bg-indigo-600 text-white text-[13px] font-black rounded-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="relative">
                            <button 
                                onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 bg-white border rounded-md text-sm font-medium transition-all shadow-sm",
                                    selectedStatuses.length > 0 ? "border-indigo-600 text-indigo-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                <AlertCircle className={cn("w-3.5 h-3.5", selectedStatuses.length > 0 ? "text-indigo-600" : "text-gray-500")} />
                                Status
                                {selectedStatuses.length > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] rounded-full">
                                        {selectedStatuses.length}
                                    </span>
                                )}
                                <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                            </button>

                            <AnimatePresence>
                                {isStatusFilterOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[60]" onClick={() => setIsStatusFilterOpen(false)} />
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[70] overflow-hidden"
                                        >
                                            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                                                <span className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Filter Status</span>
                                                <button onClick={() => setIsStatusFilterOpen(false)} className="text-slate-400 hover:text-slate-600">
                                                    <Plus className="w-4 h-4 rotate-45" />
                                                </button>
                                            </div>
                                            <div className="p-3 space-y-1">
                                                {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                                                    <label key={status} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-xl cursor-pointer group transition-colors">
                                                        <input 
                                                            type="checkbox"
                                                            checked={selectedStatuses.includes(status)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedStatuses([...selectedStatuses, status]);
                                                                } else {
                                                                    setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                                                                }
                                                            }}
                                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                        />
                                                        <span className="text-[13px] font-medium text-gray-700 group-hover:text-indigo-600 uppercase tracking-wider">{status}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            <div className="p-3 bg-gray-50 flex items-center justify-end gap-2 border-t border-gray-100">
                                                <button 
                                                    onClick={() => {
                                                        setSelectedStatuses([]);
                                                        setIsStatusFilterOpen(false);
                                                    }}
                                                    className="px-4 py-1.5 text-[13px] font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                                >
                                                    Clear All
                                                </button>
                                                <button 
                                                    onClick={() => setIsStatusFilterOpen(false)}
                                                    className="px-4 py-1.5 bg-indigo-600 text-white text-[13px] font-black rounded-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="relative">
                            <button 
                                onClick={() => setIsAssigneeFilterOpen(!isAssigneeFilterOpen)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 bg-white border rounded-md text-sm font-medium transition-all shadow-sm",
                                    selectedAssigneeIds.length > 0 ? "border-indigo-600 text-indigo-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                <motion.div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center">
                                        <Plus className="w-2.5 h-2.5 text-gray-400" />
                                    </div>
                                    Assigned To
                                </motion.div>
                                {selectedAssigneeIds.length > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] rounded-full">
                                        {selectedAssigneeIds.length}
                                    </span>
                                )}
                                <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                            </button>

                            <AnimatePresence>
                                {isAssigneeFilterOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[60]" onClick={() => setIsAssigneeFilterOpen(false)} />
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[70] overflow-hidden"
                                        >
                                            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                                                <span className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Assigned To</span>
                                                <button onClick={() => setIsAssigneeFilterOpen(false)} className="text-slate-400 hover:text-slate-600">
                                                    <Plus className="w-4 h-4 rotate-45" />
                                                </button>
                                            </div>
                                            <div className="p-3">
                                                <div className="relative mb-3">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input 
                                                        autoFocus
                                                        type="text"
                                                        placeholder="Search"
                                                        value={assigneeSearchTerm}
                                                        onChange={(e) => setAssigneeSearchTerm(e.target.value)}
                                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1">
                                                    {/* Unassigned Option */}
                                                    <label className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-xl cursor-pointer group transition-colors">
                                                        <input 
                                                            type="checkbox"
                                                            checked={selectedAssigneeIds.includes('unassigned')}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedAssigneeIds([...selectedAssigneeIds, 'unassigned']);
                                                                } else {
                                                                    setSelectedAssigneeIds(selectedAssigneeIds.filter(id => id !== 'unassigned'));
                                                                }
                                                            }}
                                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                        />
                                                        <span className="text-[13px] font-medium text-gray-700 group-hover:text-indigo-600">Unassigned</span>
                                                    </label>

                                                    {users?.filter((u: any) => u.name.toLowerCase().includes(assigneeSearchTerm.toLowerCase())).map((user: any) => (
                                                        <label key={user.userOrgId} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-xl cursor-pointer group transition-colors">
                                                            <input 
                                                                type="checkbox"
                                                                checked={selectedAssigneeIds.includes(user.userOrgId)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedAssigneeIds([...selectedAssigneeIds, user.userOrgId]);
                                                                    } else {
                                                                        setSelectedAssigneeIds(selectedAssigneeIds.filter(id => id !== user.userOrgId));
                                                                    }
                                                                }}
                                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                            />
                                                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500 border border-slate-200 uppercase">
                                                                {user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                            </div>
                                                            <span className="text-[13px] font-medium text-gray-700 group-hover:text-indigo-600 truncate">{user.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="p-4 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                                                <span className="text-[13px] text-gray-500 font-medium">{selectedAssigneeIds.length} selected</span>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => setIsAssigneeFilterOpen(false)}
                                                        className="px-5 py-2 text-[14px] font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        onClick={() => setIsAssigneeFilterOpen(false)}
                                                        className="px-6 py-2 bg-indigo-600 text-white text-[14px] font-black rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                        <select 
                            value={filterLocationId}
                            onChange={(e) => setFilterLocationId(e.target.value)}
                            className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 outline-none shadow-sm transition-colors cursor-pointer appearance-none pr-8 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.6rem_auto] bg-[right_10px_center] bg-no-repeat"
                        >
                            <option value="All">Location</option>
                            {locations.map((l: any) => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>

                        <button 
                            onClick={() => {
                                setSelectedStatuses([]);
                                setSelectedAssetIds([]);
                                setSelectedAssigneeIds([]);
                                setFilterLocationId('All');
                                setSearchTerm('');
                            }}
                            className="text-[13px] text-indigo-600 font-medium hover:text-indigo-800 ml-2 transition-colors"
                        >
                            Reset Filters
                        </button>
                        <button className="text-[13px] text-gray-700 font-medium hover:text-gray-900 ml-auto transition-colors">Save View</button>
                    </div>

                    {/* Table Area */}
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-max">
                            <thead className="bg-[#FAFAFA] sticky top-0 z-30 shadow-[0_1px_0_rgba(0,0,0,0.1)]">
                                <tr>
                                    {/* Intersection cell: sticky both top AND left — must be z-40 to beat both scroll planes */}
                                    <th className="px-4 py-3 border-b border-gray-200 w-12 text-center sticky left-0 top-0 z-40 bg-[#FAFAFA] after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-gray-200">
                                        <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                                    </th>
                                    {/* Title header: sticky left, z-30 to stay above body cells but below the intersection */}
                                    <th className="px-4 py-3 border-b border-gray-200 text-[13px] font-bold text-gray-700 whitespace-nowrap sticky left-12 top-0 z-30 bg-[#FAFAFA] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]">Title</th>
                                    {visibleColumns.image && <th className="px-4 py-3 border-b border-gray-200 text-[13px] font-bold text-gray-700 whitespace-nowrap">Image</th>}
                                    {visibleColumns.asset && <th className="px-4 py-3 border-b border-gray-200 text-[13px] font-bold text-gray-700 whitespace-nowrap">Asset</th>}
                                    {visibleColumns.status && <th className="px-4 py-3 border-b border-gray-200 text-[13px] font-bold text-gray-700 whitespace-nowrap">Status</th>}
                                    {visibleColumns.woStatus && <th className="px-4 py-3 border-b border-gray-200 text-[13px] font-bold text-gray-700 whitespace-nowrap">Work Order Status</th>}
                                    {visibleColumns.submittedDate && <th className="px-4 py-3 border-b border-gray-200 text-[13px] font-bold text-gray-700 whitespace-nowrap">Submitted Date</th>}
                                    {visibleColumns.category && <th className="px-4 py-3 border-b border-gray-200 text-[13px] font-bold text-gray-700 whitespace-nowrap">Category</th>}
                                    {visibleColumns.submittedBy && <th className="px-4 py-3 border-b border-gray-200 text-[13px] font-bold text-gray-700 whitespace-nowrap">Submitted By</th>}
                                    {visibleColumns.priority && <th className="px-4 py-3 border-b border-gray-200 text-[13px] font-bold text-gray-700 whitespace-nowrap">Priority</th>}
                                    {visibleColumns.workOrder && <th className="px-4 py-3 border-b border-gray-200 text-[13px] font-bold text-gray-700 whitespace-nowrap text-center">Work Order</th>}
                                    {visibleColumns.assignedTo && <th className="px-4 py-3 border-b border-gray-200 text-[13px] font-bold text-gray-700 whitespace-nowrap">Assigned To</th>}
                                    {visibleColumns.additionalWorkers && <th className="px-4 py-3 border-b border-gray-200 text-[13px] font-bold text-gray-700 whitespace-nowrap">Additional Workers</th>}
                                    {visibleColumns.team && <th className="px-4 py-3 border-b border-gray-200 text-[13px] font-bold text-gray-700 whitespace-nowrap">Team</th>}
                                    {visibleColumns.location && <th className="px-4 py-3 border-b border-gray-200 text-[13px] font-bold text-gray-700 whitespace-nowrap">Location</th>}
                                    {visibleColumns.tasks && <th className="px-4 py-3 border-b border-gray-200 text-[13px] font-bold text-gray-700 whitespace-nowrap text-center">Tasks</th>}
                                    <th className="px-4 py-3 border-b border-gray-200 pr-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={16} className="px-4 py-12 text-center">
                                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                            <p className="text-sm text-gray-500">Loading requests...</p>
                                        </td>
                                    </tr>
                                ) : sortedRequests.length === 0 ? (
                                    <TableEmptyState
                                        variant="request"
                                        colSpan={16}
                                        title="0 Results Returned"
                                        description="Adjust your filters to see more requests."
                                    />
                                ) : (
                                    sortedRequests.map((request: any) => (
                                        <tr 
                                            key={request.id} 
                                            onClick={() => { 
                                                setSelectedRequestId(request.id); 
                                                setIsDetailModalOpen(true); 
                                            }}
                                            className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                        >
                                            {/* Checkbox — sticky left-0, fully opaque bg so scrolled content never shows through */}
                                            <td className="px-4 py-4 text-center sticky left-0 z-10 bg-white group-hover:bg-gray-50 transition-colors after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-gray-100">
                                                <input 
                                                    type="checkbox" 
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                                                />
                                            </td>
                                            {/* Title — sticky left-12, shadow separator reveals when scrolled */}
                                            <td className="px-4 py-4 sticky left-12 z-10 bg-white group-hover:bg-gray-50 transition-colors shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                                                <div className="max-w-[200px] truncate">
                                                    <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors uppercase italic font-black tracking-tighter">REQ-{request.id.split('-')[0].toUpperCase()}</span>
                                                    <div className="text-sm text-gray-500 truncate">{request.title}</div>
                                                </div>
                                            </td>
                                            {visibleColumns.image && (
                                                <td className="px-4 py-4">
                                                    {request.imageUrl ? (
                                                        <div className="relative w-8 h-8 rounded overflow-hidden bg-gray-100 group/img">
                                                            <img src={request.imageUrl.startsWith('/files') ? `http://localhost:3000${request.imageUrl}` : request.imageUrl} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-300 shrink-0">
                                                            <Camera className="w-3.5 h-3.5" />
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                            {visibleColumns.asset && (
                                                <td className="px-4 py-4">
                                                    <div className="max-w-[150px] truncate text-sm text-gray-600 lowercase italic font-medium">
                                                        {request.asset?.name || 'none attached'}
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.status && (
                                                <td className="px-4 py-4">
                                                    <span className={cn("px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider", 
                                                        request.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                        request.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                        'bg-amber-50 text-amber-700 border border-amber-200'
                                                    )}>
                                                        {request.status}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.woStatus && (
                                                <td className="px-4 py-4 text-sm text-gray-600">
                                                    {request.workOrder?.status ? (
                                                        <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-[11px] font-bold uppercase border border-slate-200 truncate max-w-[120px] inline-block text-center tracking-wider">
                                                            {request.workOrder.status}
                                                        </span>
                                                    ) : <span className="text-gray-400 italic">unassigned</span>}
                                                </td>
                                            )}
                                            {visibleColumns.submittedDate && (
                                                <td className="px-4 py-4 text-sm font-medium text-gray-600 whitespace-nowrap">
                                                    {new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(request.createdAt))}
                                                </td>
                                            )}
                                            {visibleColumns.category && (
                                                <td className="px-4 py-4">
                                                    <span className="text-sm text-gray-600">
                                                        {request.asset?.categoryRef?.name || <span className="text-gray-400">-</span>}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.submittedBy && (
                                                <td className="px-4 py-4">
                                                    <span className="text-sm text-gray-600 truncate max-w-[120px] inline-block">
                                                        {request.requester?.user?.name || request.guestName || <span className="text-gray-400">-</span>}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.priority && (
                                                <td className="px-4 py-4 text-center">
                                                    <PriorityBadge priority={request.priority || 'NONE'} className="rounded-full" />
                                                </td>
                                            )}
                                            {visibleColumns.workOrder && (
                                                <td className="px-4 py-4 text-center">
                                                    {request.workOrder?.id ? (
                                                        <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline">
                                                            WO-{request.workOrder.id.split('-')[0].toUpperCase()}
                                                        </button>
                                                    ) : <span className="text-gray-400">-</span>}
                                                </td>
                                            )}
                                            {visibleColumns.assignedTo && (
                                                <td className="px-4 py-4">
                                                    {request.workOrder?.assignedTo?.user?.name ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shrink-0 uppercase">
                                                                {request.workOrder.assignedTo.user.name.charAt(0)}
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                                                                {request.workOrder.assignedTo.user.name}
                                                            </span>
                                                        </div>
                                                    ) : <span className="text-gray-400">-</span>}
                                                </td>
                                            )}
                                            {visibleColumns.additionalWorkers && (
                                                <td className="px-4 py-4">
                                                    {request.workOrder?.technicians?.length > 1 ? (
                                                        <div className="flex items-center">
                                                            <div className="flex -space-x-1.5">
                                                                {request.workOrder.technicians.slice(1, 4).map((tech: any, i: number) => (
                                                                    <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase" title={tech.user?.user?.name}>
                                                                        {tech.user?.user?.name?.charAt(0)}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {request.workOrder.technicians.length > 4 && (
                                                                <span className="text-xs font-bold text-gray-400 ml-2">+{request.workOrder.technicians.length - 4}</span>
                                                            )}
                                                        </div>
                                                    ) : <span className="text-gray-400">-</span>}
                                                </td>
                                            )}
                                            {visibleColumns.team && (
                                                <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                    {request.workOrder?.assignedTeam?.name || <span className="text-gray-400">-</span>}
                                                </td>
                                            )}
                                            {visibleColumns.location && (
                                                <td className="px-4 py-4">
                                                    <span className="text-sm text-gray-600 truncate max-w-[150px] inline-block">
                                                        {request.location?.name || <span className="text-gray-400">-</span>}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.tasks && (
                                                <td className="px-4 py-4 text-center">
                                                    {request.workOrder?.checklist?.items?.length ? (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 text-xs font-bold text-gray-700 border border-gray-200">
                                                            {request.workOrder.checklist.items.length}
                                                        </span>
                                                    ) : <span className="text-gray-400">-</span>}
                                                </td>
                                            )}
                                            <td className="px-4 py-4 text-right">
                                                {request.status === 'PENDING' && (
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setSelectedRequestId(request.id); setIsDetailModalOpen(true); }}
                                                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold uppercase tracking-wider transition-colors border border-emerald-200/50"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setSelectedRequestId(request.id); setIsDetailModalOpen(true); }}
                                                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md text-xs font-bold uppercase tracking-wider transition-colors border border-rose-200/50"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="fixed inset-0 z-[200] bg-white flex flex-col md:flex-row w-full h-full overflow-hidden animate-in fade-in">
                    {/* Settings Sidebar */}
                    {(!isMobile || showMobileSettingsMenu) && (
                        <div className="w-full md:w-[280px] border-b md:border-b-0 md:border-r border-gray-100 flex flex-col shrink-0 bg-white h-full overflow-y-auto">
                            <div className="p-8 flex items-center justify-between">
                                <h2 className="text-[18px] font-black text-slate-800 tracking-tight">Organization</h2>
                                {isMobile && (
                                    <button 
                                        onClick={() => setView('registry')}
                                        className="p-2 hover:bg-slate-50 rounded-full"
                                    >
                                        <Plus className="w-6 h-6 rotate-45 text-slate-400" />
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 px-4 pb-8 space-y-8">
                                {/* Organization Section */}
                                <div className="space-y-1">
                                    {[
                                        { name: 'General', icon: Settings },
                                        { name: 'Automation', icon: Zap },
                                        { name: 'User Roles', icon: Users }
                                    ].map((item) => (
                                        <button 
                                            key={item.name} 
                                            onClick={() => {
                                                setActiveSettingsSection(item.name);
                                                if (isMobile) {
                                                    setShowMobileSettingsMenu(false);
                                                }
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group",
                                                activeSettingsSection === item.name ? "bg-indigo-50/50 text-indigo-600" : "text-slate-500 hover:bg-slate-50"
                                            )}
                                        >
                                            <item.icon className={cn("w-4 h-4", activeSettingsSection === item.name ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600")} />
                                            <span className="text-[14px] font-bold">{item.name}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Modules Section */}
                                <div className="space-y-1">
                                    <h3 className="px-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Modules</h3>
                                    {[
                                        { name: 'Assets', icon: Box },
                                        { name: 'Parts & Inventory', icon: Package },
                                        { name: 'Requests', icon: Inbox },
                                        { name: 'Work Orders', icon: ClipboardList },
                                        { name: 'Purchase Orders', icon: FileText },
                                        { name: 'Meters', icon: Gauge },
                                        { name: 'Tags', icon: Tag }
                                    ].map((item) => (
                                        <button 
                                            key={item.name} 
                                            onClick={() => {
                                                setActiveSettingsSection(item.name);
                                                if (isMobile) {
                                                    setShowMobileSettingsMenu(false);
                                                }
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group",
                                                activeSettingsSection === item.name ? "bg-indigo-50/50 text-indigo-600" : "text-slate-500 hover:bg-slate-50"
                                            )}
                                        >
                                            <item.icon className={cn("w-4 h-4", activeSettingsSection === item.name ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600")} />
                                            <span className="text-[14px] font-bold">{item.name}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Advanced Section */}
                                <div className="space-y-1">
                                    <h3 className="px-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Advanced</h3>
                                    {[
                                        { name: 'API', icon: Code },
                                        { name: 'Authentication', icon: Fingerprint },
                                        { name: 'Webhooks', icon: Webhook }
                                    ].map((item) => (
                                        <button 
                                            key={item.name} 
                                            onClick={() => {
                                                setActiveSettingsSection(item.name);
                                                if (isMobile) {
                                                    setShowMobileSettingsMenu(false);
                                                }
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group",
                                                activeSettingsSection === item.name ? "bg-indigo-50/50 text-indigo-600" : "text-slate-500 hover:bg-slate-50"
                                            )}
                                        >
                                            <item.icon className={cn("w-4 h-4", activeSettingsSection === item.name ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600")} />
                                            <span className="text-[14px] font-bold">{item.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {(!isMobile || !showMobileSettingsMenu) && (
                        <div className="flex-1 bg-white overflow-hidden h-full flex flex-col">
                            {isMobile && (
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20 shrink-0">
                                    <button 
                                        onClick={() => setShowMobileSettingsMenu(true)}
                                        className="flex items-center gap-2 text-indigo-600 font-bold text-sm"
                                    >
                                        ← Settings Menu
                                    </button>
                                    <button 
                                        onClick={() => setView('registry')}
                                        className="p-1 text-slate-400 hover:text-slate-600"
                                    >
                                        <Plus className="w-5 h-5 rotate-45" />
                                    </button>
                                </div>
                            )}
                            <div className="flex-1 overflow-y-auto">
                                <div className="max-w-4xl mx-auto p-6 md:p-16 pt-8 md:pt-32 space-y-12 md:space-y-16">
                            {!['Automation', 'User Roles', 'Assets', 'Parts & Inventory', 'Work Orders', 'Purchase Orders'].includes(activeSettingsSection) && (
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <h1 className="text-[36px] font-black text-slate-800 tracking-tight">{activeSettingsSection} Settings</h1>
                                        <p className="text-[16px] text-slate-400 font-medium">Configure your organizational standards and frontline tools.</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => setView('registry')}
                                            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-[13px] font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                                        >
                                            Back to Registry
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (activeSettingsSection === 'General') {
                                                    updateGeneralSettings.mutate([
                                                        { key: 'general.language', value: language },
                                                        { key: 'general.dateFormat', value: dateFormat },
                                                        { key: 'general.currency', value: currency },
                                                        { key: 'general.timezone', value: timezone }
                                                    ]);
                                                } else {
                                                    updateSettings.mutate({ fieldSettings, formTasks });
                                                }
                                            }}
                                            disabled={updateSettings.isPending || updateGeneralSettings.isPending}
                                            className="px-8 py-2.5 bg-indigo-600 text-white text-[13px] font-black rounded-xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/40 transition-all disabled:opacity-50"
                                        >
                                            {updateSettings.isPending || updateGeneralSettings.isPending ? 'Syncing...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeSettingsSection === 'Purchase Orders' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="space-y-2">
                                            <h1 className="text-[36px] font-black text-slate-800 tracking-tight">Purchase Orders</h1>
                                            <p className="text-[16px] text-slate-400 font-medium">Configure your organizational standards for procurement and supply chain.</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button 
                                                onClick={() => setView('registry')}
                                                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-[13px] font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                                            >
                                                Back to Registry
                                            </button>
                                        </div>
                                    </div>
                                    <PurchaseOrderSettingsWorkspace />
                                </div>
                            )}
                            
                            {activeSettingsSection === 'General' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <section className="grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-gray-50 pb-16">
                                        <div className="space-y-2">
                                            <h3 className="text-[18px] font-black text-slate-800 tracking-tight">Language & Region</h3>
                                        </div>
                                        <div className="md:col-span-2 bg-white rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-10 space-y-8">
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-1">Language</label>
                                                    <select 
                                                        value={language}
                                                        onChange={(e) => setLanguage(e.target.value)}
                                                        className="w-full bg-slate-50 hover:bg-white border-none rounded-2xl px-6 py-4 text-[14px] font-bold text-slate-600 transition-all appearance-none cursor-pointer relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7rem_auto] bg-[right_20px_center] bg-no-repeat shadow-sm"
                                                    >
                                                        <option value="English (US)">English (US)</option>
                                                        <option value="English (UK)">English (UK)</option>
                                                        <option value="Spanish">Spanish</option>
                                                        <option value="French">French</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-1">Date Format</label>
                                                    <select 
                                                        value={dateFormat}
                                                        onChange={(e) => setDateFormat(e.target.value)}
                                                        className="w-full bg-slate-50 hover:bg-white border-none rounded-2xl px-6 py-4 text-[14px] font-bold text-slate-600 transition-all appearance-none cursor-pointer relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7rem_auto] bg-[right_20px_center] bg-no-repeat shadow-sm"
                                                    >
                                                        <option value="MM/DD/YY">MM/DD/YY</option>
                                                        <option value="DD/MM/YY">DD/MM/YY</option>
                                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-1">Currency</label>
                                                <select 
                                                    value={currency}
                                                    onChange={(e) => setCurrency(e.target.value)}
                                                    className="w-full bg-slate-50 hover:bg-white border-none rounded-2xl px-6 py-4 text-[14px] font-bold text-slate-600 transition-all appearance-none cursor-pointer relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7rem_auto] bg-[right_20px_center] bg-no-repeat shadow-sm"
                                                >
                                                    <option value="USD ($) — US Dollar">USD ($) — US Dollar</option>
                                                    <option value="INR (₹) — Indian Rupee">INR (₹) — Indian Rupee</option>
                                                    <option value="EUR (€) — Euro">EUR (€) — Euro</option>
                                                    <option value="GBP (£) — British Pound">GBP (£) — British Pound</option>
                                                </select>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-1">Time Zone</label>
                                                <select 
                                                    value={timezone}
                                                    onChange={(e) => setTimezone(e.target.value)}
                                                    className="w-full bg-slate-50 hover:bg-white border-none rounded-2xl px-6 py-4 text-[14px] font-bold text-slate-600 transition-all appearance-none cursor-pointer relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7rem_auto] bg-[right_20px_center] bg-no-repeat shadow-sm"
                                                >
                                                    <option value="Asia/Calcutta +05:30 IST">Asia/Calcutta +05:30 IST</option>
                                                    <option value="America/New_York -05:00 EST">America/New_York -05:00 EST</option>
                                                    <option value="Europe/London +00:00 GMT">Europe/London +00:00 GMT</option>
                                                </select>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeSettingsSection === 'Automation' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-4 max-w-4xl">
                                            <h2 className="text-[28px] font-black text-slate-800 tracking-tight">Automated Workflows</h2>
                                            <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                                                Create custom workflows as easy as If, And, Then. Save time and easily assign your work orders automatically through workflows to customize {companyName} for the way your team operates. 
                                                Check out our <span className="text-indigo-600 hover:underline cursor-pointer font-bold">Workflows Library</span> to see how others in your industry are using automated workflows.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button 
                                                onClick={() => setView('registry')}
                                                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-[13px] font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                                            >
                                                Back to Registry
                                            </button>
                                            <button 
                                                onClick={() => setIsCreateWorkflowModalOpen(true)}
                                                className="px-8 py-2.5 bg-indigo-600 text-white text-[13px] font-black rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                                            >
                                                Create
                                            </button>
                                        </div>
                                    </div>

                                    {workflows.length === 0 ? (
                                        <div className="bg-white rounded-[40px] border border-gray-100 shadow-[0_8px_40px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center py-40 px-12 text-center space-y-8">
                                            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center">
                                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                                                    <Zap className="w-8 h-8 text-indigo-500" />
                                                </div>
                                            </div>
                                            <div className="space-y-3 max-w-sm">
                                                <h3 className="text-[20px] font-black text-slate-800">No Automated Workflows</h3>
                                                <p className="text-[14px] text-slate-400 font-medium leading-relaxed">
                                                    Your automated workflows will appear here once you create them.
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => setIsCreateWorkflowModalOpen(true)}
                                                className="px-8 py-3 bg-indigo-600 text-white text-[14px] font-black rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                                            >
                                                Create Automated Workflow
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-6">
                                            {workflows.map(rule => (
                                                <div key={rule.id} className="bg-white border border-gray-100 rounded-3xl p-8 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-indigo-100 transition-all group">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                                            <Zap className="w-6 h-6 text-indigo-500" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h3 className="text-[16px] font-black text-slate-800">{rule.name}</h3>
                                                            <div className="flex items-center gap-2 text-[13px] font-medium text-slate-400">
                                                                <span>If {rule.trigger.replace(/_/g, ' ')}</span>
                                                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                                <span className="text-indigo-500">Then execute automation</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <button 
                                                            onClick={() => updateWorkflow.mutate({ id: rule.id, isActive: !rule.isActive })}
                                                            className={cn(
                                                                "w-12 h-6 rounded-full relative transition-all duration-300",
                                                                rule.isActive ? "bg-indigo-600" : "bg-slate-200"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                                                                rule.isActive ? "left-7" : "left-1"
                                                            )} />
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteWorkflow.mutate(rule.id)}
                                                            className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeSettingsSection === 'User Roles' && (
                                <RolesWorkspace />
                            )}

                            {activeSettingsSection === 'Assets' && (
                                <AssetSettingsWorkspace />
                            )}

                            {activeSettingsSection === 'Parts & Inventory' && (
                                <PartsSettingsWorkspace />
                            )}

                            {activeSettingsSection === 'Work Orders' && (
                                <WorkOrderSettingsWorkspace />
                            )}

                            {activeSettingsSection === 'Meters' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="space-y-2">
                                            <h1 className="text-[36px] font-black text-slate-800 tracking-tight">Meters</h1>
                                            <p className="text-[16px] text-slate-400 font-medium">Manage your meter categories and tracking standards.</p>
                                        </div>
                                        <button 
                                            onClick={() => setView('registry')}
                                            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-[13px] font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                                        >
                                            Back to Registry
                                        </button>
                                    </div>
                                    <MeterSettingsWorkspace />
                                </div>
                            )}

                            {activeSettingsSection === 'Tags' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="space-y-2">
                                            <h1 className="text-[36px] font-black text-slate-800 tracking-tight">Tags</h1>
                                            <p className="text-[16px] text-slate-400 font-medium">Manage global organizational tags for various models.</p>
                                        </div>
                                        <button 
                                            onClick={() => setView('registry')}
                                            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-[13px] font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                                        >
                                            Back to Registry
                                        </button>
                                    </div>
                                    <TagSettingsWorkspace />
                                </div>
                            )}

                            {activeSettingsSection === 'Authentication' && (
                                <AuthSettingsWorkspace />
                            )}

                            {activeSettingsSection === 'Webhooks' && (
                                <div className="max-w-5xl">
                                    <WebhookSettingsWorkspace />
                                </div>
                            )}

                            {activeSettingsSection === 'Requests' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Settings Sub-Header */}
                                    <div className="border-b border-gray-100">
                                        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
                                            {[
                                                { id: 'internal', label: 'General' },
                                                { id: 'categories', label: 'Categories' },
                                                { id: 'public', label: 'Public Request Portal' },
                                                { id: 'purchaseorder', label: 'Purchase Order' },
                                                { id: 'meter', label: 'Meter' },
                                                { id: 'tag', label: 'Tag' },
                                                { id: 'automation', label: 'Automation' }
                                            ].map((tab) => (
                                                <button 
                                                    key={tab.id}
                                                    onClick={() => setSettingsTab(tab.id as any)}
                                                    className={cn(
                                                        "pb-4 text-[14px] font-bold transition-all relative whitespace-nowrap",
                                                        settingsTab === tab.id ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
                                                    )}
                                                >
                                                    {tab.label}
                                                    {settingsTab === tab.id && (
                                                        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 rounded-full" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {settingsTab === 'purchaseorder' && (
                                        <div className="py-8">
                                            <PurchaseOrderSettingsWorkspace />
                                        </div>
                                    )}

                                    {settingsTab === 'meter' && (
                                        <div className="py-8">
                                            <MeterSettingsWorkspace />
                                        </div>
                                    )}

                                    {settingsTab === 'tag' && (
                                        <div className="py-8">
                                            <TagSettingsWorkspace />
                                        </div>
                                    )}

                                    {settingsTab === 'automation' && (
                                        <div className="py-8">
                                            {/* Existing Automation items */}
                                        </div>
                                    )}

                                    {settingsTab === 'categories' && (
                                        <div className="py-8 space-y-6">
                                            <div className="flex justify-end">
                                                <button 
                                                    onClick={() => {
                                                        setEditingCategory(null);
                                                        setIsAddCategoryModalOpen(true);
                                                    }}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl text-[14px] font-bold shadow-lg shadow-indigo-100 transition-all cursor-pointer"
                                                >
                                                    Add Category
                                                </button>
                                            </div>
                                            <div className="bg-white border border-gray-100 rounded-2xl overflow-visible">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="border-b border-gray-100 bg-slate-50/50">
                                                            <th className="px-8 py-6 text-[14px] font-black uppercase tracking-wider text-slate-500">Name</th>
                                                            <th className="px-8 py-6"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        <tr className="hover:bg-slate-50/30 transition-colors">
                                                            <td className="px-8 py-5 text-[14px] font-bold text-slate-700">None</td>
                                                            <td className="px-8 py-5 text-right relative">
                                                                <button 
                                                                    disabled
                                                                    className="p-2 text-slate-300 rounded-lg cursor-not-allowed"
                                                                >
                                                                    <MoreHorizontal className="w-5 h-5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                        {woCategories.map((cat: any) => (
                                                            <tr key={cat.id} className="hover:bg-slate-50/30 transition-colors group">
                                                                <td className="px-8 py-5 text-[14px] font-bold text-slate-700">{cat.name}</td>
                                                                <td className="px-8 py-5 text-right relative">
                                                                    <div className="flex items-center justify-end">
                                                                        <button 
                                                                            onClick={() => setOpenMenuId(openMenuId === cat.id ? null : cat.id)}
                                                                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors ml-auto"
                                                                        >
                                                                            <MoreHorizontal className="w-5 h-5 text-slate-400" />
                                                                        </button>

                                                                        <AnimatePresence>
                                                                            {openMenuId === cat.id && (
                                                                                <>
                                                                                    <div className="fixed inset-0 z-30" onClick={() => setOpenMenuId(null)} />
                                                                                    <motion.div 
                                                                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                                        className="absolute right-8 top-12 w-[160px] bg-white border border-slate-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] py-2 z-40 overflow-hidden text-left"
                                                                                    >
                                                                                        <button 
                                                                                            onClick={() => {
                                                                                                setEditingCategory(cat);
                                                                                                setIsAddCategoryModalOpen(true);
                                                                                                setOpenMenuId(null);
                                                                                            }}
                                                                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-[14px] font-bold text-slate-600 group/item"
                                                                                        >
                                                                                            Edit
                                                                                        </button>
                                                                                        <div className="h-[1px] bg-gray-50 mx-2" />
                                                                                        <button 
                                                                                            onClick={() => {
                                                                                                if (window.confirm('Delete this category?')) {
                                                                                                    deleteCategory.mutate(cat.id);
                                                                                                }
                                                                                                setOpenMenuId(null);
                                                                                            }}
                                                                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-50 transition-colors text-[14px] font-bold text-rose-600 group/del"
                                                                                        >
                                                                                            Delete
                                                                                        </button>
                                                                                    </motion.div>
                                                                                </>
                                                                            )}
                                                                        </AnimatePresence>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                            {settingsTab === 'internal' && (
                                <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Form Items Section */}
                                    <section className="space-y-8">
                                        <div>
                                            <h2 className="text-[24px] font-black text-slate-800 tracking-tight">Form Items</h2>
                                            <p className="text-[14px] text-slate-400 leading-relaxed mt-2">
                                                These are only displayed during Request creation. After the Request is created, the responses will be included in the Request description.
                                            </p>
                                        </div>
                                        <div className="space-y-8">
                                            {formTasks.map((task) => (
                                                <div key={task.id} className="p-8 bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-6">
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Item Type</label>
                                                            <select 
                                                                value={task.type}
                                                                onChange={(e) => setFormTasks(prev => prev.map(t => t.id === task.id ? { ...t, type: e.target.value } : t))}
                                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer pr-10 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7rem_auto] bg-[right_15px_center] bg-no-repeat shadow-sm"
                                                            >
                                                                <option value="task">Task</option>
                                                                <option value="number">Number Form Item</option>
                                                                <option value="text">Text Form Item</option>
                                                                <option value="checklist">Checklist Form Item</option>
                                                                <option value="choice">Multiple Choice Form</option>
                                                            </select>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Form Question</label>
                                                            <input 
                                                                value={task.label}
                                                                onChange={(e) => setFormTasks(prev => prev.map(t => t.id === task.id ? { ...t, label: e.target.value } : t))}
                                                                placeholder="Enter Form question"
                                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-2">
                                                        <label className="flex items-center gap-3 cursor-pointer group">
                                                            <input 
                                                                type="checkbox"
                                                                checked={task.isRequired}
                                                                onChange={(e) => setFormTasks(prev => prev.map(t => t.id === task.id ? { ...t, isRequired: e.target.checked } : t))}
                                                                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/20 transition-all"
                                                            />
                                                            <span className="text-[14px] font-bold text-slate-600 group-hover:text-slate-800 transition-colors">Required</span>
                                                        </label>
                                                        <button 
                                                            onClick={() => setFormTasks(prev => prev.filter(t => t.id !== task.id))}
                                                            className="text-[14px] font-bold text-rose-500 hover:text-rose-700 transition-colors uppercase tracking-widest"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button 
                                                onClick={() => {
                                                    setFormTasks(prev => [...prev, { 
                                                        id: Math.random().toString(), 
                                                        label: '', 
                                                        type: 'task', 
                                                        isRequired: false 
                                                    }]);
                                                }}
                                                className="flex items-center gap-2 px-6 py-4 bg-white border-2 border-dashed border-gray-100 rounded-3xl text-slate-400 text-[14px] font-bold hover:border-indigo-400 hover:text-indigo-600 hover:bg-slate-50 transition-all w-full justify-center group"
                                            >
                                                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                                Add Task
                                            </button>
                                        </div>
                                    </section>

                                    {/* Request Fields Panel */}
                                    <section className="bg-white rounded-[40px] border border-gray-100 shadow-[0_8px_40px_rgb(0,0,0,0.03)] overflow-hidden">
                                        <div className="p-10 border-b border-gray-50 bg-[#FAFAFA]/30">
                                            <h3 className="text-[32px] font-black text-slate-800 tracking-tight">Request fields</h3>
                                            <p className="text-[14px] text-zinc-500 mt-3 font-medium max-w-xl leading-relaxed">
                                                Configure the behavioral logic of your maintenance request forms. Toggle visibility and requirement rules for each field property.
                                            </p>
                                        </div>

                                        <div className="p-0 overflow-x-auto max-h-[500px] overflow-y-auto">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="border-b border-gray-50 bg-slate-50/50 sticky top-0 z-10">
                                                        <th className="w-1/3 px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest sticky top-0 bg-slate-50 z-10">Field Property</th>
                                                        <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest sticky top-0 bg-slate-50 z-10">During Create</th>
                                                        <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest sticky top-0 bg-slate-50 z-10">During Approval</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {[
                                                        { id: 'title', label: 'Title' },
                                                        { id: 'description', label: 'Description' },
                                                        { id: 'priority', label: 'Priority' },
                                                        { id: 'images', label: 'Images' },
                                                        { id: 'dueDate', label: 'Due Date' },
                                                        { id: 'category', label: 'Category' },
                                                        { id: 'location', label: 'Assigned Location' },
                                                        { id: 'asset', label: 'Assigned Asset' },
                                                        { id: 'worker', label: 'Primary Worker' },
                                                        { id: 'team', label: 'Assigned Team' },
                                                        { id: 'files', label: 'Files' },
                                                        { id: 'additional', label: 'Additional Workers' },
                                                        { id: 'start', label: 'Start Date' },
                                                        { id: 'duration', label: 'Estimated Duration' },
                                                        { id: 'checklists', label: 'Checklists' },
                                                        { id: 'signature', label: 'Signature' }
                                                    ].map((field) => (
                                                        <tr key={field.id} className="group hover:bg-slate-50/30 transition-colors">
                                                            <td className="px-10 py-6">
                                                                <span className="text-[15px] font-black text-slate-700 tracking-tight">{field.label}</span>
                                                            </td>
                                                            <td className="px-10 py-4 min-w-[160px]">
                                                                <select 
                                                                    value={fieldSettings[field.id]?.create || 'Hidden'}
                                                                    onChange={(e) => setFieldSettings(prev => ({
                                                                        ...prev,
                                                                        [field.id]: { ...prev[field.id], create: e.target.value }
                                                                    }))}
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer relative appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7rem_auto] bg-[right_15px_center] bg-no-repeat pr-10 shadow-sm"
                                                                >
                                                                    <option value="Optional">Optional</option>
                                                                    <option value="Hidden">Hidden</option>
                                                                    <option value="Required">Required</option>
                                                                </select>
                                                            </td>
                                                            <td className="px-10 py-4 min-w-[160px]">
                                                                <select 
                                                                    value={fieldSettings[field.id]?.approve || 'Hidden'}
                                                                    onChange={(e) => setFieldSettings(prev => ({
                                                                        ...prev,
                                                                        [field.id]: { ...prev[field.id], approve: e.target.value }
                                                                    }))}
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer relative appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7rem_auto] bg-[right_15px_center] bg-no-repeat pr-10 shadow-sm"
                                                                >
                                                                    <option value="Optional">Optional</option>
                                                                    <option value="Hidden">Hidden</option>
                                                                    <option value="Required">Required</option>
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {settingsTab === 'legacy' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-[0_8px_40px_rgb(0,0,0,0.02)] p-12 space-y-8 max-w-4xl">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[24px] font-black text-slate-800 tracking-tight">Company Request Portal</h3>
                                            <button className="w-12 h-6 bg-slate-200 rounded-full relative transition-colors">
                                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                            </button>
                                        </div>
                                        
                                        <p className="text-[16px] text-slate-500 font-medium leading-relaxed">
                                            The Request Portal allows users that are not on your team to add and view their request just by signing in with their email account.
                                        </p>

                                        <p className="text-[14px] text-rose-500 font-bold leading-relaxed">
                                            *By enabling the public request portal, you are allowing anyone with the portal link to submit requests. Once a request is submitted, anyone with an identifying email will be able to view the request. If you are worried about sensitive information or security, we recommend adding users as Requesters and keeping the public request portal disabled.
                                        </p>
                                    </div>
                                </div>
                            )}


                            {settingsTab === 'public' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[28px] font-black text-slate-800 tracking-tight">Request Portals</h2>
                                        <div className="flex items-center gap-4">
                                            <div className="relative group">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                                <input 
                                                    value={portalSearchTerm}
                                                    onChange={(e) => setPortalSearchTerm(e.target.value)}
                                                    placeholder="Search portals..."
                                                    className="pl-11 pr-6 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-medium w-64 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => setIsBrandingModalOpen(true)}
                                                className="px-6 py-2.5 bg-white border border-slate-200 text-indigo-600 text-[14px] font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                                            >
                                                Branding
                                            </button>
                                            <button 
                                                onClick={() => setIsCreatePortalModalOpen(true)}
                                                className="px-6 py-2.5 bg-indigo-600 text-white text-[14px] font-black rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Create Request Portal
                                            </button>
                                        </div>
                                    </div>

                                    {requestPortals.filter(p => 
                                        p.name?.toLowerCase().includes(portalSearchTerm.toLowerCase()) || 
                                        p.customUrl?.toLowerCase().includes(portalSearchTerm.toLowerCase())
                                    ).length === 0 ? (
                                        <div className="bg-white rounded-[40px] border border-gray-100 shadow-[0_8px_40px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center py-32 px-12 text-center space-y-8">
                                            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center">
                                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                                                    <Globe className="w-8 h-8 text-slate-300" />
                                                </div>
                                            </div>
                                            <div className="space-y-3 max-w-sm">
                                                <h3 className="text-[20px] font-black text-slate-800">
                                                    {portalSearchTerm ? 'No Matching Portals' : 'No Request Portals Yet'}
                                                </h3>
                                                <p className="text-[15px] text-slate-400 font-medium leading-relaxed">
                                                    {portalSearchTerm 
                                                        ? 'Try refining your search query to find the portal you are looking for.' 
                                                        : 'Create your first request portal to allow users to submit maintenance requests through a customizable, public-facing interface.'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-6">
                                            {requestPortals.filter(p => 
                                                p.name?.toLowerCase().includes(portalSearchTerm.toLowerCase()) || 
                                                p.customUrl?.toLowerCase().includes(portalSearchTerm.toLowerCase())
                                            ).map(portal => (
                                                <div key={portal.id} className="bg-white border border-gray-100 rounded-3xl p-8 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-indigo-100 transition-all group">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                                            <Globe className="w-6 h-6 text-indigo-500" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h3 className="text-[16px] font-black text-slate-800">{portal.name}</h3>
                                                            <div className="flex items-center gap-2 text-[13px] font-medium text-slate-400">
                                                                <span className="capitalize font-bold text-slate-500">{portal.type} Portal</span>
                                                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                                <a 
                                                                    href={`/portal/${portal.customUrl}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-indigo-600 hover:underline flex items-center gap-1 font-bold"
                                                                >
                                                                    /portal/{portal.customUrl}
                                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <button 
                                                            onClick={() => handleDeletePortal(portal.id)}
                                                            className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                            title="Delete Portal"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {settingsTab === 'automation' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-4 max-w-4xl">
                                            <h2 className="text-[28px] font-black text-slate-800 tracking-tight">Automated Workflows</h2>
                                            <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                                                Create custom workflows as easy as If, And, Then. Save time and easily assign your work orders automatically through workflows to customize {companyName} for the way your team operates. 
                                                Check out our <span className="text-indigo-600 hover:underline cursor-pointer">Workflows Library</span> to see how others in your industry are using automated workflows to improve their internal process and increase efficiency today!
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => setIsCreateWorkflowModalOpen(true)}
                                            className="px-8 py-3 bg-indigo-600 text-white text-[14px] font-black rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                                        >
                                            Create
                                        </button>
                                    </div>

                                    {workflows.length === 0 ? (
                                        <div className="bg-white rounded-[40px] border border-gray-100 shadow-[0_8px_40px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center py-40 px-12 text-center space-y-8">
                                            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center">
                                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                                                    <Zap className="w-8 h-8 text-indigo-500" />
                                                </div>
                                            </div>
                                            <div className="space-y-3 max-w-sm">
                                                <h3 className="text-[20px] font-black text-slate-800">No Automated Workflows</h3>
                                                <p className="text-[14px] text-slate-400 font-medium leading-relaxed">
                                                    Your automated workflows will appear here once you create them.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-6">
                                            {workflows.map(rule => (
                                                <div key={rule.id} className="bg-white border border-gray-100 rounded-3xl p-8 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-indigo-100 transition-all group">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                                            <Zap className="w-6 h-6 text-indigo-500" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h3 className="text-[16px] font-black text-slate-800">{rule.name}</h3>
                                                            <div className="flex items-center gap-2 text-[13px] font-medium text-slate-400">
                                                                <span>If {rule.trigger.replace(/_/g, ' ')}</span>
                                                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                                <span className="text-indigo-500">Then execute automation</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <button 
                                                            onClick={() => updateWorkflow.mutate({ id: rule.id, isActive: !rule.isActive })}
                                                            className={cn(
                                                                "w-12 h-6 rounded-full relative transition-all duration-300",
                                                                rule.isActive ? "bg-indigo-600" : "bg-slate-200"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                                                                rule.isActive ? "left-7" : "left-1"
                                                            )} />
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteWorkflow.mutate(rule.id)}
                                                            className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Location Picker Modal */}
            <AnimatePresence>
                {isLocationPickerOpen && (
                    <div className="fixed inset-0 z-[230] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#050505]/20 backdrop-blur-[2px]" 
                            onClick={() => setIsLocationPickerOpen(false)} 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-[500px] bg-white rounded-[32px] shadow-2xl overflow-hidden shadow-indigo-500/10"
                        >
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <h2 className="text-[18px] font-black text-slate-800">Select Locations</h2>
                                <button onClick={() => setIsLocationPickerOpen(false)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                                    <Plus className="w-5 h-5 rotate-45 text-gray-400 hover:text-gray-600" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        placeholder="Search"
                                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    />
                                </div>

                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[14px] font-bold text-slate-700">Include sub-locations in selection</span>
                                    <button 
                                        onClick={() => setIncludeSubLocations(!includeSubLocations)}
                                        className={cn(
                                            "w-11 h-5 rounded-full relative transition-all duration-300",
                                            includeSubLocations ? "bg-indigo-600" : "bg-slate-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                                            includeSubLocations ? "right-0.5" : "left-0.5"
                                        )} />
                                    </button>
                                </div>

                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1">
                                    {locations.filter((l: Location) => !l.parentId).map((loc: Location) => (
                                        <div key={loc.id} className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                                <input 
                                                    type="checkbox"
                                                    checked={tempSelectedLocationIds.includes(loc.id)}
                                                    onChange={() => toggleTempLocation(loc.id)}
                                                    className="w-5 h-5 rounded-md border-slate-200 text-indigo-600 focus:ring-indigo-500/20"
                                                />
                                                <span className="text-[15px] font-bold text-slate-700">{loc.name}</span>
                                            </div>
                                            <span className="text-[12px] font-bold text-slate-400">1 sub-location</span>
                                        </div>
                                    ))}
                                    {locations.length === 0 && (
                                        <div className="py-12 text-center space-y-2">
                                            <MapPin className="w-8 h-8 text-slate-200 mx-auto" />
                                            <p className="text-[13px] text-slate-400 font-medium">No locations found</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50/50 border-t border-gray-50 flex items-center justify-between">
                                <span className="text-[14px] font-bold text-slate-500">{tempSelectedLocationIds.length} selected</span>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setIsLocationPickerOpen(false)}
                                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-[14px] font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => setIsLocationPickerOpen(false)}
                                        className="px-8 py-2.5 bg-indigo-600 text-white text-[14px] font-black rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isCreatePortalModalOpen && (
                    <div className="fixed inset-0 z-[220] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#050505]/60 backdrop-blur-xl" 
                            onClick={() => setIsCreatePortalModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-[800px] h-[90vh] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                                <h2 className="text-[20px] font-black text-slate-800 tracking-tight">Create New Portal</h2>
                                <button onClick={() => setIsCreatePortalModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <Plus className="w-6 h-6 rotate-45 text-gray-400 hover:text-gray-600" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-12 space-y-12">
                                {/* Section 1: Details */}
                                <section className="space-y-6">
                                    <h3 className="text-[18px] font-black text-slate-800 tracking-tight">Request Portal Details</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Portal Name</label>
                                            <input 
                                                value={portalFormData.name}
                                                onChange={(e) => setPortalFormData({ ...portalFormData, name: e.target.value })}
                                                placeholder="Portal Name"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Custom Url</label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[14px] font-medium pointer-events-none">
                                                    https://request-portal.{companyName.toLowerCase().replace(/\s+/g, '')}.com/
                                                </div>
                                                <input 
                                                    value={portalFormData.customUrl}
                                                    onChange={(e) => setPortalFormData({ ...portalFormData, customUrl: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-[280px] pr-4 py-3.5 text-[15px] font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                                    placeholder="Custom Url"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Section 2: Areas & Assets */}
                                <section className="space-y-6">
                                    <div className="space-y-1">
                                        <h3 className="text-[18px] font-black text-slate-800 tracking-tight">Areas & Assets</h3>
                                        <p className="text-[14px] text-slate-400 font-medium">Specify the locations or assets for this portal.</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { id: 'general', label: 'General Portal', desc: 'Allow requests for all locations & assets', icon: Globe },
                                            { id: 'location', label: 'Location Portal', desc: 'Limit requests to specific location(s)', icon: MapPin },
                                            { id: 'asset', label: 'Asset Portal', desc: 'Limit requests to specific asset(s)', icon: Box }
                                        ].map((item) => (
                                            <div key={item.id} className="relative">
                                                <button 
                                                    onClick={() => setPortalFormData({ ...portalFormData, type: item.id })}
                                                    className={cn(
                                                        "w-full flex flex-col items-center text-center p-6 rounded-[32px] border-2 transition-all space-y-4 group min-h-[180px]",
                                                        portalFormData.type === item.id 
                                                            ? "border-indigo-600 bg-indigo-50/30 ring-4 ring-indigo-50" 
                                                            : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                                        portalFormData.type === item.id ? "bg-white shadow-sm" : "bg-white"
                                                    )}>
                                                        <item.icon className={cn("w-6 h-6", portalFormData.type === item.id ? "text-indigo-600" : "text-slate-400")} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className={cn("text-[15px] font-black", portalFormData.type === item.id ? "text-slate-800" : "text-slate-600")}>{item.label}</h4>
                                                        <p className="text-[12px] text-slate-400 font-medium leading-tight">{item.desc}</p>
                                                    </div>
                                                </button>

                                                {portalFormData.type === item.id && (item.id === 'location' || item.id === 'asset') && (
                                                    <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (item.id === 'location') setIsLocationPickerOpen(true);
                                                                if (item.id === 'asset') setIsAssetPickerOpen(true);
                                                            }}
                                                            className="w-full h-10 bg-white border border-slate-200 rounded-xl px-4 flex items-center justify-between text-[14px] font-medium text-slate-500 hover:border-indigo-300 transition-all shadow-sm"
                                                        >
                                                            <span className="truncate">
                                                                {item.id === 'location' 
                                                                    ? (tempSelectedLocationIds.length === 0 ? 'Select Locations' : `${tempSelectedLocationIds.length} locations selected`)
                                                                    : (tempSelectedAssetIds.length === 0 ? 'Select Assets' : `${tempSelectedAssetIds.length} assets selected`)
                                                                }
                                                            </span>
                                                            <ChevronDown className="w-4 h-4" />
                                                        </button>

                                                        {/* Asset Dropdown Picker (Absolute within relative parent) */}
                                                        {item.id === 'asset' && isAssetPickerOpen && (
                                                            <>
                                                                <div className="fixed inset-0 z-[140]" onClick={() => setIsAssetPickerOpen(false)} />
                                                                <motion.div 
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[150] p-4 space-y-4"
                                                                >
                                                                    <div className="relative">
                                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                                        <input 
                                                                            placeholder="Search"
                                                                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-medium focus:bg-white transition-all"
                                                                        />
                                                                    </div>
                                                                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-1">
                                                                        {assets.map((asset: Asset) => (
                                                                            <button 
                                                                                key={asset.id}
                                                                                onClick={() => toggleTempAsset(asset.id)}
                                                                                className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-all text-left"
                                                                            >
                                                                                <input 
                                                                                    type="checkbox"
                                                                                    checked={tempSelectedAssetIds.includes(asset.id)}
                                                                                    onChange={() => {}}
                                                                                    className="w-4 h-4 rounded border-slate-200 text-indigo-600 pointer-events-none"
                                                                                />
                                                                                <span className="text-[13px] font-bold text-slate-700 truncate">{asset.name}</span>
                                                                            </button>
                                                                        ))}
                                                                        {assets.length === 0 && (
                                                                            <p className="text-[12px] text-slate-400 text-center py-4 font-medium">No assets found</p>
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Section 3: Request Options */}
                                <section className="space-y-6">
                                    <div className="space-y-1">
                                        <h3 className="text-[18px] font-black text-slate-800 tracking-tight">Request Options</h3>
                                        <p className="text-[14px] text-slate-400 font-medium">Enable or disable optional fields.</p>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'attachments', label: 'Attachments', desc: 'Let users upload up to 5 photos or files.' },
                                            { id: 'location', label: 'Location', desc: 'Let users specify the exact location.' },
                                            { id: 'asset', label: 'Asset', desc: 'Let users specify an asset.' }
                                        ].map((option) => (
                                            <div key={option.id} className="group flex items-center gap-4 p-5 bg-white rounded-3xl border border-slate-100 hover:border-indigo-100 transition-all hover:shadow-sm">
                                                <input 
                                                    type="checkbox"
                                                    checked={portalFormData.options[option.id as keyof typeof portalFormData.options].enabled}
                                                    onChange={(e) => setPortalFormData({
                                                        ...portalFormData,
                                                        options: {
                                                            ...portalFormData.options,
                                                            [option.id]: { 
                                                                ...portalFormData.options[option.id as keyof typeof portalFormData.options], 
                                                                enabled: e.target.checked 
                                                            }
                                                        }
                                                    })}
                                                    className="w-6 h-6 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500/20"
                                                />
                                                <div className="flex-1">
                                                    <h4 className="text-[15px] font-black text-slate-700">{option.label}</h4>
                                                    <p className="text-[13px] text-slate-400 font-medium">{option.desc}</p>
                                                </div>
                                                <div className="flex items-center gap-3 pr-2">
                                                    <span className="text-[13px] font-bold text-slate-400">Required</span>
                                                    <button 
                                                        onClick={() => setPortalFormData({
                                                            ...portalFormData,
                                                            options: {
                                                                ...portalFormData.options,
                                                                [option.id]: { 
                                                                    ...portalFormData.options[option.id as keyof typeof portalFormData.options], 
                                                                    required: !portalFormData.options[option.id as keyof typeof portalFormData.options].required 
                                                                }
                                                            }
                                                        })}
                                                        className={cn(
                                                            "w-12 h-6 rounded-full relative transition-all duration-300",
                                                            portalFormData.options[option.id as keyof typeof portalFormData.options].required 
                                                                ? "bg-indigo-600" 
                                                                : "bg-slate-200"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                                                            portalFormData.options[option.id as keyof typeof portalFormData.options].required ? "right-1" : "left-1"
                                                        )} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Section 4: Custom Fields */}
                                <section className="space-y-6">
                                    <div className="space-y-1">
                                        <h3 className="text-[18px] font-black text-slate-800 tracking-tight">Custom Fields</h3>
                                        <p className="text-[14px] text-slate-400 font-medium">Add extra fields to collect specific details when someone submits a request.</p>
                                    </div>
                                    <div className="space-y-4">
                                        {portalFormData.customFields.map((field, index) => (
                                            <div key={index} className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-6 relative group">
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div className="space-y-2">
                                                        <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Field Type</label>
                                                        <select 
                                                            value={field.type}
                                                            onChange={(e) => {
                                                                const newFields = [...portalFormData.customFields];
                                                                newFields[index].type = e.target.value;
                                                                setPortalFormData({ ...portalFormData, customFields: newFields });
                                                            }}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7rem_auto] bg-[right_15px_center] bg-no-repeat"
                                                        >
                                                            <option value="text">Text</option>
                                                            <option value="number">Number</option>
                                                            <option value="checklist">Checklist</option>
                                                            <option value="choice">Multiple Choice</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Label</label>
                                                        <input 
                                                            value={field.label}
                                                            onChange={(e) => {
                                                                const newFields = [...portalFormData.customFields];
                                                                newFields[index].label = e.target.value;
                                                                setPortalFormData({ ...portalFormData, customFields: newFields });
                                                            }}
                                                            placeholder="Enter field name"
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-2">
                                                        <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1 block">Required</label>
                                                        <button 
                                                            onClick={() => {
                                                                const newFields = [...portalFormData.customFields];
                                                                newFields[index].required = !newFields[index].required;
                                                                setPortalFormData({ ...portalFormData, customFields: newFields });
                                                            }}
                                                            className={cn(
                                                                "w-12 h-6 rounded-full relative transition-all duration-300",
                                                                field.required ? "bg-indigo-600" : "bg-slate-200"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                                                                field.required ? "right-1" : "left-1"
                                                            )} />
                                                        </button>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            const newFields = portalFormData.customFields.filter((_, i) => i !== index);
                                                            setPortalFormData({ ...portalFormData, customFields: newFields });
                                                        }}
                                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => setPortalFormData({
                                            ...portalFormData,
                                            customFields: [...portalFormData.customFields, { type: 'text', label: '', required: false }]
                                        })}
                                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-indigo-600 text-[14px] font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Custom Field
                                    </button>
                                </section>
                            </div>

                            <div className="p-8 bg-slate-50/50 border-t border-gray-100 flex items-center justify-end gap-4 shrink-0">
                                <button 
                                    onClick={() => setIsCreatePortalModalOpen(false)}
                                    className="px-8 py-3 bg-white border border-slate-200 text-slate-600 text-[14px] font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleCreatePortal}
                                    className="px-10 py-3 bg-indigo-600 text-white text-[14px] font-black rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                                >
                                    Create Request Portal
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isBrandingModalOpen && (
                    <div className="fixed inset-0 z-[210] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#050505]/60 backdrop-blur-xl" 
                            onClick={() => setIsBrandingModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-[800px] bg-white rounded-[40px] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-[20px] font-black text-slate-800 tracking-tight">Upload Logo</h2>
                                    <span className="text-[14px] text-slate-400 font-bold">Step 1 of 2</span>
                                </div>
                                <button onClick={() => setIsBrandingModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <Plus className="w-6 h-6 rotate-45 text-gray-400 hover:text-gray-600" />
                                </button>
                            </div>

                            <div className="p-20 space-y-12">
                                <div className="text-center space-y-3">
                                    <h3 className="text-[32px] font-black text-slate-800 tracking-tight leading-tight">Upload your company logo</h3>
                                    <p className="text-[16px] text-slate-400 font-medium">We'll automatically extract your brand colors from the logo</p>
                                </div>

                                <div className="border-2 border-dashed border-slate-200 rounded-[32px] p-24 text-center space-y-6 hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer group">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                        <UploadCloud className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-[18px] font-black text-slate-600 group-hover:text-slate-800 transition-colors">Drop your logo here, or click to browse</h4>
                                        <p className="text-[14px] text-slate-400 font-medium">PNG, JPG, or SVG · Max 2MB</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50/50 border-t border-gray-100 flex items-center justify-end">
                                <button 
                                    onClick={() => setIsBrandingModalOpen(false)}
                                    className="px-8 py-3 bg-white border border-slate-200 text-slate-600 text-[14px] font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#050505]/60 backdrop-blur-xl" 
                            onClick={() => setIsCreateModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-[800px] bg-white rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col"
                        >
                            {/* Header */}
                            <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-[20px] font-semibold text-gray-900 leading-tight">Create Request</h2>
                                <button 
                                    onClick={() => setIsCreateModalOpen(false)} 
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                                >
                                    <Plus className="w-6 h-6 rotate-45 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                </button>
                            </div>

                            {/* Scrollable Form Body */}
                            <div className="px-8 py-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                                <div className="space-y-6">
                                    {fieldSettings.title?.create !== 'Hidden' && (
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-medium text-gray-700 flex items-center">
                                                Title {fieldSettings.title?.create === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            <input 
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                placeholder=""
                                                className={cn(
                                                    "w-full h-10 bg-white border rounded-md px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 shadow-sm",
                                                    fieldSettings.title?.create === 'Required' && !formData.title 
                                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                                                        : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                                                )}
                                            />
                                            <p className="text-[12px] text-gray-400 mt-1">Summarize the problem or issue</p>
                                        </div>
                                    )}

                                    {fieldSettings.description?.create !== 'Hidden' && (
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-medium text-gray-700">
                                                Description {fieldSettings.description?.create === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            <textarea 
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={4}
                                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 shadow-sm resize-none"
                                            />
                                        </div>
                                    )}

                                    {fieldSettings.priority?.create !== 'Hidden' && (
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-medium text-gray-700">Priority</label>
                                            <select 
                                                value={formData.priority}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                className="w-full h-10 bg-white border border-gray-300 rounded-md px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.6rem_auto] bg-[right_12px_center] bg-no-repeat"
                                            >
                                                <option value="NONE">None</option>
                                                <option value="LOW">Low</option>
                                                <option value="MEDIUM">Medium</option>
                                                <option value="HIGH">High</option>
                                                <option value="CRITICAL">Critical</option>
                                            </select>
                                        </div>
                                    )}

                                    {fieldSettings.location?.create !== 'Hidden' && (
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-medium text-gray-700">
                                                Operational Location {fieldSettings.location?.create === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            <select 
                                                value={formData.locationId}
                                                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                                                className="w-full h-10 bg-white border border-gray-300 rounded-md px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.6rem_auto] bg-[right_12px_center] bg-no-repeat"
                                            >
                                                <option value="">Select Location...</option>
                                                {locations.map((l: any) => (
                                                    <option key={l.id} value={l.id}>{l.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {formTasks.length > 0 && (
                                        <div className="space-y-3 pt-2">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Additional Tasks</label>
                                            <div className="grid grid-cols-1 gap-2">
                                                {formTasks.map(task => (
                                                    <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!taskResponses[task.id]}
                                                            onChange={() => toggleTaskResponse(task.id)}
                                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                                                        />
                                                        <span className="text-sm font-bold text-slate-600">{task.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {fieldSettings.asset?.create !== 'Hidden' && (
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-medium text-gray-700">
                                                Asset {fieldSettings.asset?.create === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            <select
                                                value={formData.assetId}
                                                onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                                                className="w-full h-10 bg-white border border-gray-300 rounded-md px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.6rem_auto] bg-[right_12px_center] bg-no-repeat"
                                            >
                                                <option value="">Select Asset...</option>
                                                {assets.map((a: any) => (
                                                    <option key={a.id} value={a.id}>{a.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {fieldSettings.images?.create !== 'Hidden' && (
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-medium text-gray-700">Image</label>
                                            <div className="border border-dashed border-gray-300 rounded-lg p-5 bg-white relative group transition-all hover:border-indigo-400">
                                                <input 
                                                    type="file"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                                    accept="image/*"
                                                />
                                                <div className="flex items-center gap-3">
                                                    <button type="button" className="px-4 py-1.5 bg-white border border-gray-300 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap z-0">
                                                        Upload
                                                    </button>
                                                    <span className="text-[13px] text-gray-400 font-medium">
                                                        {selectedFile ? selectedFile.name : 'or Drop Images'}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-gray-400 mt-2 font-medium">
                                                    Max: 200MB · Videos up to 150MB
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {fieldSettings.files?.create !== 'Hidden' && (
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-medium text-gray-700">Files</label>
                                            <div className="border border-dashed border-gray-300 rounded-lg p-5 bg-white relative group transition-all hover:border-indigo-400">
                                                <input 
                                                    type="file"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                                />
                                                <div className="flex items-center gap-3">
                                                    <button type="button" className="px-4 py-1.5 bg-white border border-gray-300 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap z-0">
                                                        Upload
                                                    </button>
                                                    <span className="text-[13px] text-gray-400 font-medium">
                                                        {selectedFile ? selectedFile.name : 'or Drop Files'}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-gray-400 mt-2 font-medium">
                                                    Max: 200MB · Videos up to 150MB
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                                <button 
                                    onClick={() => setIsCreateModalOpen(false)} 
                                    className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    disabled={createRequest.isPending || !formData.title}
                                    onClick={() => createRequest.mutate(formData)}
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[13px] font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {createRequest.isPending ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Unified Request Detail & Approval Modal */}
            <AnimatePresence>
                {isDetailModalOpen && selectedRequest && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseDetailModal}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 15 }}
                            className="relative w-full max-w-[1100px] h-[90vh] max-h-[850px] bg-white rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col font-outfit"
                        >
                            {/* Modal Header */}
                            <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
                                <div className="flex items-center gap-3">
                                    {!isReadOnly && (
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider rounded-md">
                                            REQ-{selectedRequest.id.split('-')[0].toUpperCase()}
                                        </span>
                                    )}
                                    <h2 className="text-[20px] font-semibold text-gray-900 leading-tight">
                                        {isReadOnly ? `Request #${selectedRequest.id.split('-')[0].toUpperCase()}` : 'Request Details'}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* PDF Options */}
                                    <div className="relative">
                                        <select 
                                            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-xs font-bold text-gray-600 outline-none appearance-none pr-8 cursor-pointer hover:bg-gray-100 transition-colors"
                                            defaultValue="pdf"
                                        >
                                            <option value="pdf">PDF Options</option>
                                            <option value="export">Export PDF</option>
                                            <option value="print">Print Request</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleCloseDetailModal} 
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                                    >
                                        <Plus className="w-6 h-6 rotate-45 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                    </button>
                                </div>
                            </div>

                            {/* Split Pane Body */}
                            <div className="flex-1 flex overflow-hidden min-h-0">
                                
                                {/* Left Pane (Scrollable, 60% Width) */}
                                <div className="w-[60%] border-r border-gray-100 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                                    
                                    {isReadOnly && (
                                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
                                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                                                <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                                            </div>
                                            <span className="text-[14px] font-medium text-emerald-800">
                                                This request was approved and turned into Work Order <span className="text-blue-600 font-bold">#{selectedRequest.workOrder?.id?.split('-')[0].toUpperCase()}</span>
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Title */}
                                    {fieldSettings.title?.approve !== 'Hidden' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-gray-700 flex items-center">
                                            Title {fieldSettings.title?.approve === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <input 
                                            value={detailTitle}
                                            onChange={(e) => setDetailTitle(e.target.value)}
                                            placeholder="Request title..."
                                            disabled={isReadOnly}
                                            className="w-full h-10 bg-white border border-gray-300 rounded-md px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm font-medium disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                                        />
                                    </div>
                                    )}

                                    {/* Description */}
                                    {fieldSettings.description?.approve !== 'Hidden' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Description {fieldSettings.description?.approve === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <textarea 
                                            value={detailDescription}
                                            onChange={(e) => setDetailDescription(e.target.value)}
                                            placeholder="Add detailed description here..."
                                            rows={4}
                                            disabled={isReadOnly}
                                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm resize-none font-medium disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                                        />
                                    </div>
                                    )}

                                    {/* Priority Select */}
                                    {fieldSettings.priority?.approve !== 'Hidden' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Priority {fieldSettings.priority?.approve === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <div className="relative">
                                            <select 
                                                value={detailPriority}
                                                onChange={(e) => setDetailPriority(e.target.value)}
                                                disabled={isReadOnly}
                                                className="w-full h-10 bg-white border border-gray-300 rounded-md px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm pr-10 font-medium disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                                            >
                                                <option value="NONE">None</option>
                                                <option value="LOW">Low</option>
                                                <option value="MEDIUM">Medium</option>
                                                <option value="HIGH">High</option>
                                                <option value="CRITICAL">Critical</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                    )}

                                    {/* Image Upload Dropzone */}
                                    {fieldSettings.images?.approve !== 'Hidden' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Image {fieldSettings.images?.approve === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        {detailImageUrl ? (
                                            <div className="relative border border-gray-200 rounded-lg p-3 bg-gray-50 flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <img 
                                                        src={detailImageUrl.startsWith('/files') ? `http://localhost:3000${detailImageUrl}` : detailImageUrl} 
                                                        alt="Request Thumbnail" 
                                                        className="w-12 h-12 object-cover rounded-md border border-gray-200 bg-white" 
                                                    />
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-700">Attached Image</p>
                                                        <button 
                                                            onClick={() => setDetailImageUrl('')}
                                                            className="text-[11px] text-red-500 hover:underline font-bold"
                                                        >
                                                            Remove Image
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                "border border-dashed border-gray-300 rounded-lg p-5 bg-white relative group transition-all hover:border-indigo-400",
                                                isReadOnly && "bg-gray-50 border-gray-200 pointer-events-none"
                                            )}>
                                                {!isReadOnly && (
                                                    <input 
                                                        type="file"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                setDetailFileName(file.name);
                                                                setDetailImageUrl(URL.createObjectURL(file));
                                                            }
                                                        }}
                                                        accept="image/*"
                                                    />
                                                )}
                                                <div className="flex items-center gap-3">
                                                    <button type="button" disabled={isReadOnly} className="px-4 py-1.5 bg-white border border-gray-300 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap z-0 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200">
                                                        Upload Image
                                                    </button>
                                                    <span className="text-[13px] text-gray-400 font-medium">
                                                        {detailFileName ? detailFileName : 'or Drop Image Here'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    )}

                                    {/* Start Date & Due Date pickers */}
                                    {(fieldSettings.start?.approve !== 'Hidden' || fieldSettings.dueDate?.approve !== 'Hidden') && (
                                    <div className="grid grid-cols-2 gap-6">
                                        {fieldSettings.start?.approve !== 'Hidden' && (
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-bold text-gray-700">
                                                Start Date {fieldSettings.start?.approve === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <input 
                                                        type="date"
                                                        value={detailStartDate}
                                                        onChange={(e) => setDetailStartDate(e.target.value)}
                                                        disabled={isReadOnly}
                                                        className="w-full h-10 bg-white border border-gray-300 rounded-md pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                                                    />
                                                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                </div>
                                                <div className="relative w-28">
                                                    <input 
                                                        type="time"
                                                        value={detailStartTime}
                                                        onChange={(e) => setDetailStartTime(e.target.value)}
                                                        disabled={isReadOnly}
                                                        className="w-full h-10 bg-white border border-gray-300 rounded-md pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                                                    />
                                                    <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                </div>
                                            </div>
                                        </div>
                                        )}

                                        {fieldSettings.dueDate?.approve !== 'Hidden' && (
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-bold text-gray-700">
                                                Due Date {fieldSettings.dueDate?.approve === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <input 
                                                        type="date"
                                                        value={detailDueDate}
                                                        onChange={(e) => setDetailDueDate(e.target.value)}
                                                        disabled={isReadOnly}
                                                        className="w-full h-10 bg-white border border-gray-300 rounded-md pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                                                    />
                                                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                </div>
                                                <div className="relative w-28">
                                                    <input 
                                                        type="time"
                                                        value={detailDueTime}
                                                        onChange={(e) => setDetailDueTime(e.target.value)}
                                                        disabled={isReadOnly}
                                                        className="w-full h-10 bg-white border border-gray-300 rounded-md pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                                                    />
                                                    <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                </div>
                                            </div>
                                        </div>
                                        )}
                                    </div>
                                    )}

                                    {/* Category Select */}
                                    {fieldSettings.category?.approve !== 'Hidden' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Category {fieldSettings.category?.approve === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <div className="relative">
                                            <select 
                                                value={detailCategory}
                                                onChange={(e) => setDetailCategory(e.target.value)}
                                                disabled={isReadOnly}
                                                className="w-full h-10 bg-white border border-gray-300 rounded-md px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm pr-10 font-medium disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                                            >
                                                <option value="">Select Category...</option>
                                                {categories.map((cat: any) => (
                                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                    )}

                                    {/* Operational Location */}
                                    {fieldSettings.location?.approve !== 'Hidden' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Location {fieldSettings.location?.approve === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <div className="relative">
                                            <select 
                                                value={detailLocationId}
                                                onChange={(e) => setDetailLocationId(e.target.value)}
                                                disabled={isReadOnly}
                                                className="w-full h-10 bg-white border border-gray-300 rounded-md px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm pr-10 font-medium disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                                            >
                                                <option value="">Select Location...</option>
                                                {locations.map((loc: any) => (
                                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                    )}

                                    {/* Asset */}
                                    {fieldSettings.asset?.approve !== 'Hidden' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Asset {fieldSettings.asset?.approve === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <div className="relative">
                                            <select 
                                                value={detailAssetId}
                                                onChange={(e) => setDetailAssetId(e.target.value)}
                                                disabled={isReadOnly}
                                                className="w-full h-10 bg-white border border-gray-300 rounded-md px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm pr-10 font-medium disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                                            >
                                                <option value="">Select Asset...</option>
                                                {assets.map((asset: any) => (
                                                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                    )}

                                    {/* Primary Worker */}
                                    {fieldSettings.worker?.approve !== 'Hidden' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Primary Worker {fieldSettings.worker?.approve === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <div className="relative flex gap-3 items-center">
                                            {detailPrimaryWorkerId ? (
                                                <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 uppercase shrink-0">
                                                    {users.find(u => u.userOrgId === detailPrimaryWorkerId)?.name?.charAt(0) || 'U'}
                                                </div>
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                                                    ?
                                                </div>
                                            )}
                                            <div className="relative flex-1">
                                                <select 
                                                    value={detailPrimaryWorkerId}
                                                    onChange={(e) => setDetailPrimaryWorkerId(e.target.value)}
                                                    disabled={isReadOnly}
                                                    className="w-full h-10 bg-white border border-gray-300 rounded-md px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm pr-10 font-medium disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                                                >
                                                    <option value="">Select Primary Worker...</option>
                                                    {users.map((u: any) => (
                                                        <option key={u.userOrgId} value={u.userOrgId}>{u.name} — {u.roleName}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                    <ChevronDown className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    )}

                                    {/* Additional Workers */}
                                    {fieldSettings.additional?.approve !== 'Hidden' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Additional Workers {fieldSettings.additional?.approve === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <div className="relative">
                                            <select 
                                                value={detailAdditionalWorkerId}
                                                onChange={(e) => setDetailAdditionalWorkerId(e.target.value)}
                                                disabled={isReadOnly}
                                                className="w-full h-10 bg-white border border-gray-300 rounded-md px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm pr-10 font-medium disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                                            >
                                                <option value="">Select Additional Workers...</option>
                                                {users.map((u: any) => (
                                                    <option key={u.userOrgId} value={u.userOrgId}>{u.name} — {u.roleName}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                    )}

                                    {/* Team */}
                                    {fieldSettings.team?.approve !== 'Hidden' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Team {fieldSettings.team?.approve === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <div className="relative">
                                            <select 
                                                value={detailTeamId}
                                                onChange={(e) => setDetailTeamId(e.target.value)}
                                                disabled={isReadOnly}
                                                className="w-full h-10 bg-white border border-gray-300 rounded-md px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm pr-10 font-medium disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                                            >
                                                <option value="">Select Team...</option>
                                                {teams.map((t: any) => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                    )}

                                    {/* Checklists */}
                                    {fieldSettings.checklists?.approve !== 'Hidden' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Checklists {fieldSettings.checklists?.approve === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <div className="relative">
                                            <select 
                                                value={detailChecklistId}
                                                onChange={(e) => setDetailChecklistId(e.target.value)}
                                                disabled={isReadOnly}
                                                className="w-full h-10 bg-white border border-gray-300 rounded-md px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm pr-10 font-medium disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                                            >
                                                <option value="">Select Checklist...</option>
                                                {checklists.map((chk: any) => (
                                                    <option key={chk.id} value={chk.id}>{chk.title}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                    )}

                                    {/* Estimated Duration */}
                                    {fieldSettings.duration?.approve !== 'Hidden' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Estimated Duration (Hours) {fieldSettings.duration?.approve === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <input 
                                            value={detailEstimatedDuration}
                                            onChange={(e) => setDetailEstimatedDuration(e.target.value)}
                                            placeholder="e.g. 2.5"
                                            disabled={isReadOnly}
                                            className="w-full h-10 bg-white border border-gray-300 rounded-md px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm font-medium disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                                        />
                                    </div>
                                    )}

                                    {/* Signature Required */}
                                    {fieldSettings.signature?.approve !== 'Hidden' && (
                                    <div className="flex items-center gap-3 pt-2">
                                        <input 
                                            type="checkbox" 
                                            id="detailSignatureRequired"
                                            checked={detailSignatureRequired}
                                            onChange={(e) => setDetailSignatureRequired(e.target.checked)}
                                            disabled={isReadOnly}
                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:bg-gray-50 disabled:border-gray-200" 
                                        />
                                        <label htmlFor="detailSignatureRequired" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                                            Signature Required upon Completion {fieldSettings.signature?.approve === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                    </div>
                                    )}

                                    {/* Files dropzone */}
                                    {fieldSettings.files?.approve !== 'Hidden' && (
                                    <div className="space-y-1.5 pt-4">
                                        <label className="text-[13px] font-bold text-gray-700">
                                            Files {fieldSettings.files?.approve === 'Required' && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <div className={cn(
                                            "border border-dashed border-gray-300 rounded-lg p-5 bg-white relative group transition-all hover:border-indigo-400",
                                            isReadOnly && "bg-gray-50 border-gray-200 pointer-events-none"
                                        )}>
                                            {!isReadOnly && (
                                                <input 
                                                    type="file"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            toast.success(`Attached file: ${file.name}`);
                                                        }
                                                    }}
                                                />
                                            )}
                                            <div className="flex items-center gap-3">
                                                <button type="button" disabled={isReadOnly} className="px-4 py-1.5 bg-white border border-gray-300 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap z-0 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200">
                                                    Upload Files
                                                </button>
                                                <span className="text-[13px] text-gray-400 font-medium">
                                                    or Drop Files Here
                                                </span>
                                            </div>
                                        </div>
                                        {!isReadOnly && (
                                            <div className="pt-2 text-right">
                                                <button 
                                                    type="button" 
                                                    onClick={() => toast.success('Saved Files pipeline ready!')}
                                                    className="text-xs font-bold text-indigo-600 hover:underline hover:text-indigo-800"
                                                >
                                                    Add from Saved Files
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    )}
                                </div>

                                {/* Right Pane (Sticky Sidebar, 40% Width) */}
                                <div className="w-[40%] flex flex-col bg-slate-50 min-h-0">
                                    {/* Sidebar Header */}
                                    <div className="px-6 py-4 border-b border-gray-200/60 bg-white">
                                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
                                            Internal Updates
                                        </h3>
                                    </div>

                                    {/* Message Log */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 custom-scrollbar">
                                        {(!requestComments[selectedRequestId || ''] || requestComments[selectedRequestId || ''].length === 0) ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                                <div className="w-12 h-12 rounded-full bg-slate-200/50 flex items-center justify-center mb-3">
                                                    <Send className="w-5 h-5 text-slate-400 rotate-45 -translate-y-0.5" />
                                                </div>
                                                <p className="text-xs font-bold text-slate-500">
                                                    No internal updates yet
                                                </p>
                                                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                                                    Write a message below to start the thread.
                                                </p>
                                            </div>
                                        ) : (
                                            requestComments[selectedRequestId || ''].map((comment) => (
                                                <div key={comment.id} className="bg-white border border-gray-200/60 rounded-xl p-4 shadow-sm space-y-3 animate-in fade-in slide-in-from-bottom duration-350">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 uppercase shrink-0">
                                                            {getInitials(comment.sender)}
                                                        </div>
                                                        <div className="flex-1 flex items-center justify-between">
                                                            <span className="text-xs font-bold text-gray-700 lowercase">{comment.sender}</span>
                                                            <span className="text-[10px] text-gray-400 font-bold">
                                                                {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(comment.timestamp))}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5 text-xs text-gray-700 font-bold whitespace-pre-wrap">
                                                        {comment.text}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Sidebar Bottom Input Card */}
                                    <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                                        <div className="bg-slate-50 border border-gray-200 rounded-xl p-3 flex flex-col gap-2">
                                            <textarea 
                                                value={chatMessage}
                                                onChange={(e) => setChatMessage(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendComment();
                                                    }
                                                }}
                                                placeholder="Write a message..."
                                                rows={2}
                                                className="w-full bg-transparent border-none p-0 text-xs text-gray-700 focus:ring-0 placeholder:text-slate-400 font-medium resize-none"
                                            />
                                            <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                                                <button 
                                                    type="button"
                                                    onClick={() => toast.success('Attachment option ready')}
                                                    className="p-1.5 hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                                                >
                                                    <Paperclip className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={handleSendComment}
                                                    disabled={!chatMessage.trim()}
                                                    className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                                >
                                                    <Send className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            {!isReadOnly && (
                                <div className="px-8 py-4 bg-white border-t border-gray-100 flex items-center justify-between shrink-0">
                                    <button 
                                        onClick={() => {
                                            if (selectedRequestId) {
                                                rejectRequest.mutate(selectedRequestId);
                                            }
                                        }}
                                        disabled={rejectRequest.isPending}
                                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50"
                                    >
                                        Decline Request
                                    </button>
                                    
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => {
                                                if (selectedRequestId) {
                                                    updateRequest.mutate({
                                                        id: selectedRequestId,
                                                        title: detailTitle,
                                                        description: detailDescription,
                                                        priority: detailPriority,
                                                        locationId: detailLocationId || null,
                                                        assetId: detailAssetId || null
                                                    });
                                                }
                                            }}
                                            disabled={updateRequest.isPending || !detailTitle.trim()}
                                            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                        >
                                            Save Without Approving
                                        </button>
                                        
                                        <button 
                                            onClick={async () => {
                                                if (selectedRequestId) {
                                                    try {
                                                        // 1. Save edits first via API
                                                        await api.patch(`/requests/${selectedRequestId}`, {
                                                            title: detailTitle,
                                                            description: detailDescription,
                                                            priority: detailPriority,
                                                            locationId: detailLocationId || null,
                                                            assetId: detailAssetId || null
                                                        });
                                                        
                                                        // 2. Dispatch approval mutation with configuration
                                                        approveRequest.mutate({
                                                            id: selectedRequestId,
                                                            assignedToId: detailPrimaryWorkerId || null,
                                                            priority: detailPriority,
                                                            dueDate: getMergedISOString(detailDueDate, detailDueTime),
                                                            startDate: getMergedISOString(detailStartDate, detailStartTime),
                                                            assignedTeamId: detailTeamId || null,
                                                            checklistId: detailChecklistId || null,
                                                            estimatedHours: detailEstimatedDuration || null,
                                                            signatureRequired: detailSignatureRequired
                                                        });
                                                    } catch (err) {
                                                        toast.error('Failed to pre-save request edits prior to approval');
                                                    }
                                                }
                                            }}
                                            disabled={approveRequest.isPending || !detailTitle.trim()}
                                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-md hover:shadow-indigo-500/30 active:scale-95 disabled:opacity-50"
                                        >
                                            {approveRequest.isPending ? 'Spawning Work Order...' : 'Approve Request'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Advanced Filters Modal */}
            <AnimatePresence>
                {isFiltersModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#050505]/40 backdrop-blur-sm" 
                            onClick={() => setIsFiltersModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-[500px] bg-white rounded-3xl shadow-2xl"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-[18px] font-bold text-gray-900">Filters</h3>
                                <button onClick={() => setIsFiltersModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <Plus className="w-5 h-5 rotate-45 text-gray-400 hover:text-gray-600" />
                                </button>
                            </div>
                            
                            <div className="p-12 overflow-y-auto max-h-[400px]">
                                {activeFilters.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                                        <div className="space-y-1">
                                            <h4 className="text-[15px] font-bold text-gray-900">No filters added yet.</h4>
                                            <p className="text-[13px] text-gray-500">When you add filters, they'll appear here.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {activeFilters.map((filter, index) => (
                                            <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-indigo-200">
                                                <div className="flex-1">
                                                    <span className="text-[12px] font-black uppercase tracking-widest text-slate-400 block mb-1">{filter.field.replace(/([A-Z])/g, ' $1')}</span>
                                                    <input 
                                                        type="text"
                                                        value={filter.value || ''}
                                                        onChange={(e) => {
                                                            const newFilters = [...activeFilters];
                                                            newFilters[index].value = e.target.value;
                                                            setActiveFilters(newFilters);
                                                        }}
                                                        placeholder={`Filter by ${filter.field}...`}
                                                        className="w-full bg-transparent border-none p-0 text-[14px] font-bold text-slate-700 focus:ring-0 placeholder:text-slate-300"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => setActiveFilters(activeFilters.filter((_, i) => i !== index))}
                                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-white border-t border-gray-100 flex items-center justify-between rounded-b-3xl">
                                <div className="relative">
                                    <button 
                                        onClick={() => setIsAddFieldOpen(!isAddFieldOpen)}
                                        className="flex items-center gap-2 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-bold text-[14px]"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Add Filter</span>
                                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isAddFieldOpen && "rotate-180")} />
                                    </button>

                                    <AnimatePresence>
                                        {isAddFieldOpen && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setIsAddFieldOpen(false)} />
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 py-2 overflow-hidden"
                                                >
                                                    <div className="px-4 py-2 border-b border-slate-50 mb-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Field</span>
                                                    </div>
                                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                                        {filterOptions.map((option) => (
                                                            <button
                                                                key={option.id}
                                                                onClick={() => {
                                                                    if (!activeFilters.find(f => f.field === option.label)) {
                                                                        setActiveFilters([...activeFilters, { field: option.label, value: '' }]);
                                                                    }
                                                                    setIsAddFieldOpen(false);
                                                                }}
                                                                className="w-full px-4 py-2.5 text-left text-[13px] font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center justify-between group"
                                                            >
                                                                {option.label}
                                                                <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setIsFiltersModalOpen(false)}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 font-bold text-[14px] rounded-xl hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => setIsFiltersModalOpen(false)}
                                        className="px-6 py-2 bg-indigo-600 text-white font-black text-[14px] rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                <CreateWorkflowModal 
                    isOpen={isCreateWorkflowModalOpen}
                    onClose={() => setIsCreateWorkflowModalOpen(false)}
                />

                <AddCategoryModal 
                    isOpen={isAddCategoryModalOpen}
                    onClose={() => setIsAddCategoryModalOpen(false)}
                    onCreate={(data) => {
                        if (editingCategory) {
                            updateCategory.mutate({ id: editingCategory.id, name: data.name });
                        } else {
                            createCategory.mutate(data.name);
                        }
                    }}
                    categories={woCategories}
                    editingCategory={editingCategory}
                />
            </AnimatePresence>
        </div>
    );
};
