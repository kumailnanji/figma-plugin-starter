export type SpringCurve = {
    name: string;
    type: 'spring';
    stiffness: number;
    damping: number;
    mass: number;
};

export type BezierCurve = {
    name: string;
    type: 'bezier';
    values: [number, number, number, number];
};

export type Curve = SpringCurve | BezierCurve;

export const curves: Curve[] = [
    {
        name: 'Custom 1',
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 1,
    },
    {
        name: 'Custom 2',
        type: 'spring',
        stiffness: 120,
        damping: 17,
        mass: 1,
    },
    {
        name: 'Custom 3',
        type: 'bezier',
        values: [0.42, 0, 0.58, 1]
    },
    {
        name: 'Custom 4',
        type: 'bezier',
        values: [0.25, 0.1, 0.25, 1]
    },
];