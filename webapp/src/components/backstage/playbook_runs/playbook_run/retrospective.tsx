// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useMemo, useRef, useState} from 'react';
import styled from 'styled-components';
import {useIntl} from 'react-intl';
import debounce from 'debounce';

import {PlaybookRun, RunMetricData} from 'src/types/playbook_run';
import {PlaybookWithChecklist} from 'src/types/playbook';
import {fetchPlaybookRun, publishRetrospective, updateRetrospective} from 'src/client';
import {playbookRunUpdated} from 'src/actions';
import {useAppDispatch} from 'src/hooks/redux';
import {Timestamp} from 'src/webapp_globals';
import {AnchorLinkTitle, Content, Role} from 'src/components/backstage/playbook_runs/shared';
import MetricsData from 'src/components/backstage/playbook_runs/playbook_run/metrics/metrics_data';
import Report from 'src/components/backstage/playbook_runs/playbook_run/retrospective/report';
import ConfirmModalLight from 'src/components/widgets/confirmation_modal_light';
import {TertiaryButton} from 'src/components/assets/buttons';
import {PAST_TIME_SPEC} from 'src/components/time_spec';

interface Props {
    id: string;
    playbookRun: PlaybookRun;
    playbook: PlaybookWithChecklist | null;
    role: Role;
    focusMetricId?: string;
}

const DEBOUNCE_2_SECS = 2000;

const Retrospective = ({
    id,
    playbookRun,
    playbook,
    role,
    focusMetricId,
}: Props) => {
    const dispatch = useAppDispatch();
    const {formatMessage} = useIntl();
    const [showConfirmation, setShowConfirmation] = useState(false);
    const childRef = useRef<any>(null);

    const onMetricsChange = useMemo(
        () => debounce((metrics_data: RunMetricData[]) => {
            updateRetrospective(playbookRun.id, playbookRun.retrospective, metrics_data);
        }, DEBOUNCE_2_SECS),
        [playbookRun.id, playbookRun.retrospective],
    );
    const onReportChange = useMemo(
        () => debounce((retrospective: string) => {
            updateRetrospective(playbookRun.id, retrospective, playbookRun.metrics_data);
        }, DEBOUNCE_2_SECS),
        [playbookRun.id, playbookRun.metrics_data],
    );

    if (!playbookRun.retrospective_enabled) {
        return null;
    }

    const onConfirmPublish = async () => {
        await publishRetrospective(playbookRun.id, playbookRun.retrospective, playbookRun.metrics_data);
        const updatedRun = await fetchPlaybookRun(playbookRun.id);
        dispatch(playbookRunUpdated(updatedRun));
        setShowConfirmation(false);
    };

    const onPublishClick = () => {
        if (childRef.current) {
            const valid = childRef.current.validateInputs();
            if (!valid) {
                return;
            }
        }
        setShowConfirmation(true);
    };

    const isPublished = playbookRun.retrospective_published_at > 0 && !playbookRun.retrospective_was_canceled;
    const notEditable = isPublished || role === Role.Viewer;

    const renderPublishComponent = () => {
        const publishedAt = (
            <Timestamp
                value={playbookRun.retrospective_published_at}
                {...PAST_TIME_SPEC}
            />
        );

        return (
            <>
                {
                    isPublished &&
                    <TimestampContainer>
                        <i className={'icon icon-check-all'}/>
                        {formatMessage({defaultMessage: 'Published {timestamp}'}, {timestamp: publishedAt})}
                    </TimestampContainer>
                }
                <TertiaryButton
                    size='sm'
                    onClick={onPublishClick}
                    disabled={isPublished}
                >
                    {formatMessage({defaultMessage: 'Publish'})}
                </TertiaryButton>
            </>
        );
    };

    return (
        <Container
            id={id}
            data-testid={'run-retrospective-section'}
        >
            <div>
                <Header>
                    <AnchorLinkTitle
                        title={formatMessage({defaultMessage: 'Retrospective'})}
                        id={id}
                    />
                    {role === Role.Participant ? (
                        <HeaderButtonsRight>
                            {renderPublishComponent()}
                        </HeaderButtonsRight>
                    ) : null}
                </Header>
                <StyledContent>
                    {playbook?.metrics &&
                        <MetricsData
                            idPrefix={id}
                            ref={childRef}
                            metricsData={playbookRun.metrics_data}
                            metricsConfigs={playbook.metrics}
                            notEditable={notEditable}
                            onEdit={onMetricsChange}
                            flushChanges={() => onMetricsChange.flush()}
                            focusMetricId={focusMetricId}
                        />}
                    <Report
                        playbookRun={playbookRun}
                        onEdit={onReportChange}
                        flushChanges={() => onReportChange.flush()}
                        notEditable={notEditable}
                    />
                </StyledContent>
            </div>
            <ConfirmModalLight
                show={showConfirmation}
                title={formatMessage({defaultMessage: 'Are you sure you want to publish?'})}
                message={formatMessage({defaultMessage: 'You will not be able to edit the retrospective report after publishing it. Do you want to publish the retrospective report?'})}
                confirmButtonText={formatMessage({defaultMessage: 'Publish'})}
                onConfirm={onConfirmPublish}
                onCancel={() => setShowConfirmation(false)}
            />
        </Container>
    );
};

export default Retrospective;

const StyledContent = styled(Content)`
    padding: 0 24px;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    padding-right: 12px;
`;

const HeaderButtonsRight = styled.div`
    display: flex;
    flex-grow: 1;
    align-items: center;
    justify-content: flex-end;

    > * {
        margin-left: 4px;
    }
`;

const TimestampContainer = styled.div`
    margin-right: 16px;
    color: rgba(var(--center-channel-color-rgb), 0.72);
    font-weight: normal;
`;

const Container = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 20px;
`;
