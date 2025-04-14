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
import { YachtClass } from '../types/orcsc';

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
    const [classData, setClassData] = useState({
        classId: '',
        className: '',
        yachtClass: YachtClass.ORC
    });

    const handleAdd = () => {
        if (classData.classId && classData.className) {
            onAdd(classData.classId, classData.className, classData.yachtClass);
            setClassData({
                classId: '',
                className: '',
                yachtClass: YachtClass.ORC
            });
            onClose();
        }
    };

    const handleYachtClassChange = (e: React.ChangeEvent<{ value: unknown }>) => {
        setClassData(prev => ({
            ...prev,
            yachtClass: e.target.value as YachtClass
        }));
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Add New Class</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <TextField
                        label="Class ID"
                        value={classData.classId}
                        onChange={(e) => setClassData(prev => ({ ...prev, classId: e.target.value }))}
                        fullWidth
                        required
                    />
                    <TextField
                        label="Class Name"
                        value={classData.className}
                        onChange={(e) => setClassData(prev => ({ ...prev, className: e.target.value }))}
                        fullWidth
                        required
                    />
                    <TextField
                        select
                        label="Yacht Class"
                        value={classData.yachtClass}
                        onChange={handleYachtClassChange}
                        fullWidth
                        SelectProps={{
                            native: true
                        }}
                    >
                        <option value={YachtClass.ORC}>ORC</option>
                        <option value={YachtClass.OneDesign}>One Design</option>
                    </TextField>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={handleAdd}
                    variant="contained"
                    disabled={!classData.classId || !classData.className}
                >
                    Add
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 