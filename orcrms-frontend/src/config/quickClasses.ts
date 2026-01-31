import { YachtClass } from '../types/orcsc';

export type QuickClass = {
    classId: string;
    className: string;
    yachtClass: YachtClass;
};

export const quickClasses: QuickClass[] = [
    { classId: 'O1', className: 'ORC1', yachtClass: YachtClass.ORC },
    { classId: 'O2', className: 'ORC2', yachtClass: YachtClass.ORC },
    { classId: 'O3', className: 'ORC3', yachtClass: YachtClass.ORC },
    { classId: 'Z', className: 'Amami', yachtClass: YachtClass.OneDesign },
    { classId: 'SN', className: 'Snonit', yachtClass: YachtClass.OneDesign },
    { classId: 'SE', className: 'Snonit EDU', yachtClass: YachtClass.OneDesign },
    { classId: 'SF', className: 'Sayfan', yachtClass: YachtClass.OneDesign }
];
