import { type WorkOrderSync } from '../lib/db';

/**
 * Standardizes mapping from backend to frontend for consistent UI and DB state.
 * This ensures that status logic, assignee names, and relation flattening
 * are consistent across the entire application.
 */
export const mapWorkOrder = (wo: any): WorkOrderSync => {
    // Destructure to remove the raw objects that cause React crashes
    const { asset, location, team, assignedTeam, assignedTo, request, ...cleanWo } = wo;
    
    return {
        ...cleanWo,
        request: request || wo.request || null,
        requestId: request?.id || wo.requestId || null,
        woNumber: String(wo.workOrderNo || wo.woNumber || ''),
        locationName: location?.name || wo.locationName,
        assetName: asset?.name || wo.assetName,
        teamName: assignedTeam?.name || team?.name || wo.teamName,
        requestedBy: request?.guestName || request?.requester?.user?.name || wo.requestedBy || 'SYSTEM',
        
        // Status normalization for industrial UI
        status: wo.status ? (
            wo.status === 'IN_PROGRESS' || wo.status === 'In Progress' ? 'In Progress' :
            wo.status === 'ON_HOLD' || wo.status === 'On Hold' ? 'On Hold' :
            wo.status === 'OPEN' || wo.status === 'Open' ? 'Open' :
            wo.status === 'COMPLETE' || wo.status === 'COMPLETED' || wo.status === 'Complete' ? 'Complete' :
            wo.status === 'PENDING_APPROVAL' || wo.status === 'Pending approval' || wo.status === 'Pending Approval' ? 'PENDING_APPROVAL' :
            wo.status[0].toUpperCase() + wo.status.slice(1).toLowerCase().replace('_', ' ')
        ) : wo.status,
        
        priority: wo.priority ? (wo.priority[0].toUpperCase() + wo.priority.slice(1).toLowerCase()) : wo.priority,
        assignee: (assignedTo?.user?.name) || wo.assignee || 'Unassigned',
        assignedToId: wo.assignedToId,
        isBookmarked: !!wo.isBookmarked,
        isRepeating: !!wo.isRepeating,

        // Map checklist items to tasks for the frontend UI
        tasks: wo.checklist?.items?.map((item: any) => ({
            id: item.id,
            text: item.task,
            type: item.dataType === 'PASS_FAIL' ? 'Inspection' : item.dataType === 'NUMBER' ? 'Number' : 'Text',
            status: 'Todo', // Initial UI state
            isRequired: item.isRequired,
            requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false },
            isExpanded: false
        })) || wo.tasks || [],

        // Map planned parts
        parts: wo.plannedParts?.map((p: any) => ({
            partId: p.partId,
            name: p.part?.name,
            quantity: Number(p.quantity)
        })) || []
    };
};
