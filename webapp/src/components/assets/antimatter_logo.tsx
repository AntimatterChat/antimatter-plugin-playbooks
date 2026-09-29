// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import antimatterIcon from 'src/components/assets/antimatter_icon.png';

const defaultFill = '#818698';
const productName = 'Antimatter';

const toPixels = (value: string | number) => (typeof value === 'number' ? `${value}px` : `${parseFloat(value)}px`);

// AntimatterLogo renders the Antimatter icon followed by the product name.
const AntimatterLogo = (props: {className?: string, fill?: string; width?: string | number; height?: string | number;}) => {
    const height = toPixels(props.height || '25');

    return (
        <span
            className={props.className}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3em',
                maxWidth: props.width ? toPixels(props.width) : undefined,
                height,
                color: props.fill || defaultFill,
                fontSize: `calc(${height} * 0.75)`,
                fontWeight: 600,
                lineHeight: 1,
                whiteSpace: 'nowrap',
            }}
        >
            <img
                src={antimatterIcon}
                alt=''
                style={{height, width: height}}
            />
            {productName}
        </span>
    );
};

export default AntimatterLogo;
