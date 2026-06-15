import { useState, useEffect, useCallback, useMemo } from 'react';
import { AgGridReact, AgGridProvider } from 'ag-grid-react';
import { AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

export default function ScoreGrid({ items, values = {}, onChange, disabled, sectionLabel }) {
    const [localValues, setLocalValues] = useState(() => ({ ...values }));

    useEffect(() => {
        setLocalValues(prev => {
            const keys = Object.keys(values);
            if (keys.length === 0) return {};
            const merged = { ...prev };
            let changed = false;
            for (const [k, v] of Object.entries(values)) {
                if (prev[k] !== v) {
                    merged[k] = v;
                    changed = true;
                }
            }
            return changed ? merged : prev;
        });
    }, [values]);

    const handleCellChange = useCallback((key, val) => {
        setLocalValues(prev => {
            const next = { ...prev, [key]: val };
            onChange(next);
            return next;
        });
    }, [onChange]);

    const rowData = useMemo(() => {
        return Object.entries(items).map(([key, label], idx) => ({
            no: idx + 1,
            key,
            label,
            value: localValues[key] ?? null,
        }));
    }, [items, localValues]);

    const colDefs = useMemo(() => [
        {
            field: 'no',
            headerName: 'No',
            width: 50,
            maxWidth: 50,
            cellClass: 'flex items-center justify-center text-text-muted text-[10px] font-mono',
        },
        {
            field: 'label',
            headerName: 'Unsur Penilaian',
            flex: 1,
            cellClass: 'flex items-center text-white text-[11px]',
        },
        {
            field: 'value',
            headerName: 'Nilai',
            width: 90,
            maxWidth: 90,
            editable: !disabled,
            cellEditor: 'agTextCellEditor',
            cellClassRules: {
                'bg-emerald-900/40 text-emerald-300': (params) => params.value !== null && params.value !== undefined,
                'bg-red-900/30 text-red-300': (params) => params.value === null || params.value === undefined,
            },
            cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
            valueParser: (params) => {
                if (params.newValue === null || params.newValue === undefined || params.newValue === '') return null;
                const n = parseInt(params.newValue);
                if (isNaN(n)) return null;
                return Math.min(100, Math.max(0, n));
            },
            onCellValueChanged: (params) => {
                if (params.newValue == null && params.oldValue == null) return;
                params.node.setDataValue('value', params.newValue);
                handleCellChange(params.data.key, params.newValue);
            },
        },
    ], [disabled, handleCellChange]);

    const defaultColDef = useMemo(() => ({
        resizable: false,
        sortable: false,
        filter: false,
    }), []);

    const total = useMemo(() => {
        return Object.values(localValues).reduce((s, v) => s + (parseInt(v) || 0), 0);
    }, [localValues]);

    const filledCount = useMemo(() => {
        return Object.values(localValues).filter(v => v !== null && v !== undefined && parseInt(v) > 0).length;
    }, [localValues]);

    const totalCount = Object.keys(items).length;

    return (
        <div>
            <div className="ag-theme-quartz-dark" style={{ height: Math.max(200, rowData.length * 36 + 40), width: '100%' }}>
                <AgGridProvider modules={[AllCommunityModule]}>
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={colDefs}
                        defaultColDef={defaultColDef}
                        rowHeight={32}
                        headerHeight={32}
                        theme="legacy"
                        suppressMovableColumns={true}
                        suppressColumnVirtualisation={true}
                        enableCellEditingOnBackspace={true}
                        enterNavigatesVertically={true}
                        enterNavigatesVerticallyAfterEdit={true}
                        stopEditingWhenCellsLoseFocus={true}
                        singleClickEdit={true}
                        domLayout="normal"
                        getRowId={(params) => params.data.key}
                    />
                </AgGridProvider>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-text-muted font-mono">
                        Terisi <span className="text-emerald-400 font-bold">{filledCount}</span>/{totalCount}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Terisi" />
                        <span className="inline-block w-2 h-2 rounded-full bg-red-500" title="Kosong" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider">Total {sectionLabel || ''}</span>
                    <span className="text-sm font-bold font-mono text-gold-bright">{total}</span>
                </div>
            </div>
        </div>
    );
}
