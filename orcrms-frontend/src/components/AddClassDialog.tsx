import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box
} from '@mui/material';
import { useState } from 'react';
import type { YachtClass } from '../types/orcsc';

interface AddClassDialogProps {
    open: boolean;
    onClose: () => void;
    onAdd: (classId: string, className: string, yachtClass: YachtClass) => void;
}

export const AddClassDialog: React.FC<AddClassDialogProps> = ({
    open,
    onClose,
    onAdd
}) => {
    const [classId, setClassId] = useState('');
    const [className, setClassName] = useState('');
    const [yachtClass, setYachtClass] = useState<YachtClass>('ORC');

    const handleAdd = () => {
        if (classId && className) {
            onAdd(classId, className, yachtClass);
            setClassId('');
            setClassName('');
            setYachtClass('ORC');
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Add New Class</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <TextField
                        label="Class ID"
                        value={classId}
                        onChange={(e) => setClassId(e.target.value)}
                        fullWidth
                        required
                    />
                    <TextField
                        label="Class Name"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        fullWidth
                        required
                    />
                    <TextField
                        select
                        label="Yacht Class"
                        value={yachtClass}
                        onChange={(e) => setYachtClass(e.target.value as YachtClass)}
                        fullWidth
                        SelectProps={{
                            native: true
                        }}
                    >
                        <option value="ORC">ORC</option>
                        <option value="OneDesign">One Design</option>
                    </TextField>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={handleAdd}
                    variant="contained"
                    disabled={!classId || !className}
                >
                    Add
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 