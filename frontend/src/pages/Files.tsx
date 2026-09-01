import { useState } from 'react';
import {
    Search,
    SlidersHorizontal,
    Tags,
    LayoutTemplate,
    ArrowDownUp,
    PanelLeft,
    X,
    ChevronDown,
    FileText,
    MoreVertical,
    Download,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export const FilesPage = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedTag, setSelectedTag] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const queryClient = useQueryClient();

    // Fetch documents
    const { data: documents = [] } = useQuery({
        queryKey: ['documents'],
        queryFn: async () => {
            const res = await api.get('/documents');
            return res.data;
        }
    });

    // Upload & Create Document
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            // 1. Upload to storage
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // 2. Create document record
            const docRes = await api.post('/documents', {
                filename: file.name,
                url: uploadRes.data.url,
                mimeType: file.type,
                size: file.size,
                tags: selectedTag ? [selectedTag] : []
            });
            return docRes.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            setIsAddModalOpen(false);
            setSelectedTag('');
            setIsUploading(false);
        },
        onError: (err) => {
            console.error('Failed to upload file:', err);
            setIsUploading(false);
        }
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            uploadMutation.mutate(file);
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header */}
            <div className="bg-transparent border-b border-slate-200/60 px-6 flex items-center justify-between h-[60px]">
                <div className="flex items-center h-full">
                    <button className="text-slate-400 hover:text-slate-600 mr-4 transition-colors">
                        <PanelLeft className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-px bg-slate-200 mr-4" />
                    <h1 className="text-[18px] font-bold text-slate-800 mr-8">File Management</h1>
                    
                    <div className="flex items-center h-full">
                        <div className="h-full flex items-center px-4 border-b-2 border-primary text-[14px] font-medium text-slate-800 cursor-pointer">
                            Files
                        </div>
                    </div>
                </div>

                <div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-white rounded text-[14px] font-medium transition-colors"
                    >
                        Add Files
                    </button>
                </div>
            </div>

            {/* Toolbar 1: Sort, Columns, Search */}
            <div className="bg-transparent border-b border-slate-200/60 px-6 py-2.5 flex items-center justify-between">
                <div className="text-[13px] font-bold text-slate-700">
                    {documents.length} Results Returned
                </div>
                <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 text-[13px] font-medium text-slate-700 hover:text-slate-900 transition-colors">
                        <ArrowDownUp className="w-4 h-4" />
                        Sort: Uploaded On
                    </button>
                    <button className="flex items-center gap-2 text-[13px] font-medium text-slate-700 hover:text-slate-900 transition-colors">
                        <LayoutTemplate className="w-4 h-4" />
                        Columns
                    </button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search"
                            className="w-[200px] pl-9 pr-3 py-1.5 bg-white/50 border border-slate-200/60 rounded text-[13px] text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>
            </div>

            {/* Toolbar 2: Filters, Tags */}
            <div className="px-6 py-4 flex items-center justify-between bg-transparent">
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-white/70 border border-slate-200/60 rounded-lg text-[14px] font-medium text-slate-600 hover:bg-white transition-colors shadow-sm">
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-white/70 border border-slate-200/60 rounded-lg text-[14px] font-medium text-slate-600 hover:bg-white transition-colors shadow-sm">
                        <Tags className="w-4 h-4" />
                        Tags
                        <svg className="w-3.5 h-3.5 text-slate-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <button className="text-[13px] font-medium text-primary hover:text-primary/80 ml-2 transition-colors">
                        Reset Filters
                    </button>
                </div>
                <div>
                    <button className="text-[13px] font-medium text-slate-700 hover:text-slate-900 transition-colors">
                        Save View
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-6 pb-6 flex-1 bg-transparent overflow-y-auto pt-6">
                {documents.length === 0 ? (
                    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-lg p-8 shadow-[0_1px_2px_rgb(0,0,0,0.02)] max-w-5xl mx-auto">
                        <h2 className="text-[20px] font-bold text-slate-800 mb-2">Add Files</h2>
                        <p className="text-[14px] text-slate-500 mb-6 max-w-3xl">
                            Files allow your company to upload physical documents and attach them to relevant workflows to better optimize your operations
                        </p>
                        
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded text-[14px] font-medium transition-colors mb-10"
                        >
                            Add Files
                        </button>
                        
                        <div className="border-t border-slate-100 pt-6">
                            <h3 className="text-[14px] font-bold text-slate-700 mb-2">Resources</h3>
                            <ul className="list-disc list-inside text-[14px] text-slate-800">
                                <li>
                                    <a href="#" className="text-primary hover:underline">Learn more</a> about files and best practices
                                </li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {documents.map((doc: any) => (
                            <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <button className="text-slate-400 hover:text-slate-600">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                                <h3 className="font-bold text-[14px] text-slate-800 truncate" title={doc.filename}>{doc.filename}</h3>
                                <p className="text-[12px] text-slate-500 mt-1">{(doc.size / 1024 / 1024).toFixed(2)} MB &middot; {new Date(doc.createdAt).toLocaleDateString()}</p>
                                
                                <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 mt-4">
                                    <span className="text-[12px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                        {doc.tags?.length > 0 ? doc.tags[0] : 'Document'}
                                    </span>
                                    <a href={doc.url} download target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary transition-colors">
                                        <Download className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Files Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-[500px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 pb-4">
                            <h2 className="text-[22px] font-bold text-slate-800">Add Files</h2>
                            <button 
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="px-6 py-2 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[14px] text-slate-700">Files</label>
                                <div className="w-full border border-dashed border-slate-300 rounded-lg bg-white p-8 flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors relative">
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                    />
                                    <button className="px-4 py-1.5 bg-white border border-slate-300 rounded text-[14px] font-medium text-slate-700 shadow-sm pointer-events-none">
                                        {isUploading ? 'Uploading...' : 'Upload'}
                                    </button>
                                    <span className="text-[14px] text-slate-500 pointer-events-none">or Drop Files</span>
                                </div>
                                <p className="text-[13px] text-slate-600 pt-1">Max: 200MB &middot; Videos up to 150MB</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[14px] text-slate-700">Tags</label>
                                <div className="relative">
                                    <select 
                                        className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-lg text-[14px] text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                                        value={selectedTag}
                                        onChange={(e) => setSelectedTag(e.target.value)}
                                    >
                                        <option value="">Select a tag...</option>
                                        <option value="Manual">Manual</option>
                                        <option value="Blueprint">Blueprint</option>
                                        <option value="SOP">SOP</option>
                                        <option value="Invoice">Invoice</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-6 flex items-center justify-between mt-4">
                            <button 
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-6 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-[14px] font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                        className="px-6 py-2 bg-primary opacity-50 cursor-not-allowed text-white rounded text-[14px] font-medium transition-colors"
                                    >
                                        Add Files
                                    </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

