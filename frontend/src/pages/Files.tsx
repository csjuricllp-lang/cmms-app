import { useState } from 'react';
import {
    FileText,
    Upload,
    Search,
    Download,
    Eye,
    Box,
    File,
    MoreVertical,
    BookOpen,
    History,
    HardDrive
} from 'lucide-react';
import { useAssets } from '../hooks/useData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

export const FilesPage = () => {
    const queryClient = useQueryClient();
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

    const { data: assets } = useAssets();

    const uploadMutation = useMutation({
        mutationFn: async ({ assetId, file }: { assetId: string, file: File }) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('assetId', assetId);
            return api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets-with-files'] });
        }
    });

    const handleFileUpload = (assetId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            uploadMutation.mutate({ assetId, file });
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Manual & Document Vault</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Centralized repository for asset manuals, safety SOPs, and technical blueprints.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="glass-card px-4 py-2 flex items-center gap-2 border-primary/20">
                        <HardDrive className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">Storage: 4.2 GB / 10 GB</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* Asset Filter Sidebar */}
                <div className="space-y-6">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4">Browse by Asset</h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => setSelectedAssetId(null)}
                            className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all", !selectedAssetId ? "bg-primary/20 text-primary border border-primary/20" : "text-muted-foreground hover:bg-white/5")}
                        >
                            <Box className="w-4 h-4" />
                            <span className="text-sm font-semibold">Discovery / All Files</span>
                        </button>
                        {assets?.map((asset: any) => (
                            <button
                                key={asset.id}
                                onClick={() => setSelectedAssetId(asset.id)}
                                className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all", selectedAssetId === asset.id ? "bg-primary/20 text-primary border border-primary/20" : "text-muted-foreground hover:bg-white/5")}
                            >
                                <BookOpen className="w-4 h-4" />
                                <span className="text-sm font-semibold truncate text-left">{asset.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* File Content Area */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-white/5">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search manuals, IDs, or filenames..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                        {selectedAssetId && (
                            <label className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
                                <Upload className="w-4 h-4" />
                                NEW DOCUMENT
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(selectedAssetId, e)} />
                            </label>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(assets?.flatMap((a: any) => a.attachments || []).filter((f: any) => !selectedAssetId || f.assetId === selectedAssetId) || []).map((file: any) => (
                            <div key={file.id} className="glass-card p-6 group transition-all hover:translate-y-[-4px]">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <button className="p-2 rounded-lg hover:bg-white/5"><MoreVertical className="w-4 h-4 text-muted-foreground" /></button>
                                </div>

                                <div>
                                    <h4 className="font-bold truncate" title={file.filename}>{file.filename}</h4>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Manual / Blueprint</p>
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                                        <History className="w-3.5 h-3.5" />
                                        <span>v1.2</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <a href={file.url} download className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Empty Placeholder */}
                        {(!assets || assets.length === 0) && (
                            <div className="col-span-full py-20 text-center space-y-4">
                                <File className="w-12 h-12 text-white/5 mx-auto" />
                                <p className="text-muted-foreground italic">No assets or files found. Start by selecting an asset to upload a manual.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

