import * as XLSX from 'xlsx';
import type { PMSchedule } from '../types';

export const PM_TEMPLATE_HEADERS = [
    'Name',
    'Description',
    'Work Order Title',
    'Work Order Description',
    'Asset Name (Exact Match)',
    'Category',
    'Assigned To Email',
    'Priority (CRITICAL/HIGH/MEDIUM/LOW/NONE)',
    'Frequency Type (DAYS/WEEKS/MONTHS/YEARS)',
    'Frequency Value'
];

/**
 * Downloads an empty template for users to fill in their PMs
 */
export const downloadPMTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([PM_TEMPLATE_HEADERS]);
    const wb = XLSX.utils.book_new();
    
    // Set column widths for better UX
    ws['!cols'] = [
        { wch: 30 }, // Name
        { wch: 40 }, // Description
        { wch: 30 }, // WO Title
        { wch: 40 }, // WO Description
        { wch: 25 }, // Asset Name
        { wch: 20 }, // Category
        { wch: 25 }, // Assigned To Email
        { wch: 20 }, // Priority
        { wch: 20 }, // Frequency Type
        { wch: 15 }, // Frequency Value
    ];

    XLSX.utils.book_append_sheet(wb, ws, "PM Template");
    XLSX.writeFile(wb, "Preventive_Maintenance_Template.xlsx");
};

/**
 * Exports current PM schedules to Excel
 */
export const exportPMSchedules = (schedules: PMSchedule[], assets: any[], users: any[]) => {
    const data = schedules.map(schedule => {
        const asset = assets.find(a => a.id === schedule.assetId);
        const user = users.find(u => (u.userOrgId || u.id) === schedule.assignedToId);

        return {
            'Name': schedule.name,
            'Description': schedule.description || '',
            'Work Order Title': schedule.woTitle || '',
            'Work Order Description': schedule.woDescription || '',
            'Asset Name': asset ? asset.name : '',
            'Category': schedule.categoryId || '', // Note: In a real app we'd map categoryId to name
            'Assigned To Email': user ? user.email : '',
            'Priority': schedule.priority,
            'Frequency Type': schedule.frequencyType || '',
            'Frequency Value': schedule.frequencyValue || '',
            'Status': schedule.status
        };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    
    // Set column widths
    ws['!cols'] = [
        { wch: 30 },
        { wch: 40 },
        { wch: 30 },
        { wch: 40 },
        { wch: 25 },
        { wch: 20 },
        { wch: 25 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Schedules");
    XLSX.writeFile(wb, "Exported_PM_Schedules.xlsx");
};

/**
 * Parses an uploaded Excel file and returns JSON data
 */
export const parsePMImportFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};
