// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ComponentProps} from 'react';
import {useIntl} from 'react-intl';
import styled from 'styled-components';

import GenericModal, {DefaultFooterContainer} from 'src/components/widgets/generic_modal';
import EmptyState from 'src/components/fusion/empty_state';

const ID = 'playbooks_rhs_run_details_tour';

export const makeRhsRunDetailsTourDialog = (props: Props) => ({
    modalId: ID,
    dialogType: RhsRunDetailsTourDialog,
    dialogProps: props,
});

type Props = {
    onDismiss: () => void;
    onConfirm: () => void;
} & Partial<ComponentProps<typeof GenericModal>>;

const RhsRunDetailsTourDialog = ({onDismiss, onConfirm, ...modalProps}: Props) => {
    const {formatMessage} = useIntl();

    return (
        <DialogModal
            id={ID}
            confirmButtonText={formatMessage({defaultMessage: 'Take a quick tour'})}
            cancelButtonText={formatMessage({defaultMessage: 'Let me explore for myself'})}
            autoCloseOnCancelButton={true}
            autoCloseOnConfirmButton={true}
            handleConfirm={onConfirm}
            handleCancel={onDismiss}
            onHide={onDismiss}
            components={{FooterContainer: Footer}}
            {...modalProps}
        >
            <EmptyState
                icon='runbook'
                title={formatMessage({defaultMessage: 'We’ve auto-created your run'})}
                text={formatMessage({defaultMessage: 'This lets you experience a sample playbook first before investing time to create your own. '})}
            />
        </DialogModal>
    );
};

const DialogModal = styled(GenericModal)`
    width: 512px;
`;

const Footer = styled(DefaultFooterContainer)`
    align-items: center;
`;

export default RhsRunDetailsTourDialog;
