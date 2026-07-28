const params = {
  page: 1,
  limit: 20,
  dueDateStart: '2026-06-21T18:30:00.000Z',
  dueDateEnd: '2026-06-21T18:30:00.000Z',
};

const localData = [
  {
    id: '8111526c-1025-44c0-9875-c4a74ab2cdfb',
    title: 'printer repairing',
    dueDate: '2026-06-03T07:50:00.000Z',
  },
  {
    id: '86c8ae71-fff5-4592-abf8-db5c87f55b7e',
    title: '[REQ] E2E Test Request',
    dueDate: '2026-06-03T08:01:11.880Z',
  }
];

let mappedLocalData = [...localData];

if (params?.dueDateStart || params?.dueDateEnd) {
    mappedLocalData = mappedLocalData.filter(wo => {
        if (!wo.dueDate) return false;
        const date = new Date(wo.dueDate);
        if (params.dueDateStart) {
            if (date < new Date(params.dueDateStart)) return false;
        }
        if (params.dueDateEnd) {
            const end = new Date(params.dueDateEnd);
            if (end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0) {
                end.setHours(23, 59, 59, 999);
            }
            if (date > end) return false;
        }
        return true;
    });
}

console.log("Filtered count:", mappedLocalData.length);
console.log("Filtered items:", mappedLocalData);
