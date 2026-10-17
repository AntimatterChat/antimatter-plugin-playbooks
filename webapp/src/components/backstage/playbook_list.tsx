// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getCurrentTeamId} from 'mattermost-redux/selectors/entities/teams';
import React, {PropsWithChildren, useEffect, useRef} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';

import styled from 'styled-components';

import {Redirect} from 'react-router-dom';

import {useAppDispatch, useAppSelector} from 'src/hooks/redux';

import {Mark, Measure, measureAndReport} from 'src/performance_telemetry';
import {displayPlaybookCreateModal} from 'src/actions';
import {PrimaryButton, TertiaryButton} from 'src/components/assets/buttons';
import BackstageListHeader from 'src/components/backstage/backstage_list_header';
import PlaybookListRow from 'src/components/backstage/playbook_list_row';
import SearchInput from 'src/components/backstage/search_input';
import {HorizontalSpacer} from 'src/components/backstage/styles';
import TemplateSelector from 'src/components/templates/template_selector';
import {PaginationRow} from 'src/components/pagination_row';
import {SortableColHeader} from 'src/components/sortable_col_header';
import {BACKSTAGE_LIST_PER_PAGE} from 'src/constants';
import {useCanCreatePlaybooksInTeam, usePlaybooksCrud, usePlaybooksRouting} from 'src/hooks';
import {useImportPlaybook} from 'src/components/backstage/import_playbook';
import {Playbook} from 'src/types/playbook';
import PresetTemplates from 'src/components/templates/template_data';
import EmptyState from 'src/components/fusion/empty_state';
import FusionIcon from 'src/components/fusion/icon';
import {pluginUrl} from 'src/browser_routing';

import Header from 'src/components/widgets/header';

import {useLHSRefresh} from 'src/components/backstage/lhs_navigation';

import {ToastStyle} from 'src/components/backstage/toast';
import {useToaster} from 'src/components/backstage/toast_banner';

import {useFileDragDetection} from 'src/components/backstage/file_drag_detection';
import {useCompactList} from 'src/panel/panel_width';
import {FileUploadOverlay} from 'src/components/backstage/file_upload_overlay';

import CheckboxInput from './runs_list/checkbox_input';
import useConfirmPlaybookArchiveModal from './archive_playbook_modal';
import NoContentPage from './playbook_list_getting_started';
import useConfirmPlaybookRestoreModal from './restore_playbook_modal';

const ContainerMedium = styled.article`
    padding: 8px 12px 0;
    scroll-margin-top: 20px;
`;

const PlaybookListContainer = styled.div`
    position: relative;
    height: 100%;
    color: var(--am-text, rgba(var(--center-channel-color-rgb), 0.9));
    overflow-y: hidden;
`;

const ScrollContainer = styled.div`
  height: 100%;
  overflow-y: auto;
`;

const TableContainer = styled.div`
    overflow-x: hidden;
    overflow-x: clip;
`;

// The heading of the templates under the list, as the Fusion UI's section headings (.am-app-h).
const TemplatesHeading = styled.h4`
    display: flex;
    align-items: center;
    margin: 16px 2px 8px;
    color: var(--am-muted, rgba(var(--center-channel-color-rgb), 0.56));
    font-size: 11px;
    font-weight: 700;
    gap: 8px;
    letter-spacing: 0.07em;
    text-transform: uppercase;

    .am-grow {
        flex: 1;
    }
`;

const TitleActions = styled.div`
    display: flex;
`;

const ImportLink = styled.button`
    padding: 0 6px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--am-matter, var(--button-bg));
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;

    &:hover {
        background: var(--am-matter-soft, rgba(var(--button-bg-rgb), 0.08));
    }
`;

const PlaybooksListFilters = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 16px;
`;

const PlaybookList = (props: { firstTimeUserExperience?: boolean }) => {
    const {formatMessage} = useIntl();
    const teamId = useAppSelector(getCurrentTeamId);
    const canCreatePlaybooks = useCanCreatePlaybooksInTeam(teamId);
    const content = useRef<JSX.Element | null>(null);
    const selectorRef = useRef<HTMLDivElement>(null);
    const refreshLHS = useLHSRefresh();
    const addToast = useToaster().add;

    const {
        playbooks,
        isLoading, totalCount, params,
        setPage, sortBy, setSelectedPlaybook, archivePlaybook, restorePlaybook, duplicatePlaybook, setSearchTerm, isFiltering, setWithArchived, fetchPlaybooks,
    } = usePlaybooksCrud({per_page: BACKSTAGE_LIST_PER_PAGE});

    useEffect(() => {
        if (!isLoading) {
            measureAndReport({
                name: Measure.PlaybooksListLoadDurationMs,
                startMark: Mark.PlaybooksLHSButtonClicked,
                canFail: true,
            });
            performance.clearMarks(Mark.PlaybooksLHSButtonClicked);
        }
    }, [isLoading]);

    const [confirmArchiveModal, openConfirmArchiveModal] = useConfirmPlaybookArchiveModal(archivePlaybook);
    const [confirmRestoreModal, openConfirmRestoreModal] = useConfirmPlaybookRestoreModal(restorePlaybook);

    const {view, edit} = usePlaybooksRouting<string>({onGo: setSelectedPlaybook});
    const [fileInputRef, inputImportPlaybook, importPlaybookFile] = useImportPlaybook(teamId, (id: string) => {
        refreshLHS();
        edit(id);
    });

    const isDraggingFile = useFileDragDetection();

    // In a side panel narrower than the table: one line per playbook, without the table's sortable header.
    const compact = useCompactList();

    const hasPlaybooks = Boolean(playbooks?.length);

    if (props.firstTimeUserExperience && hasPlaybooks) {
        return <Redirect to={pluginUrl('/playbooks')}/>;
    }

    const scrollToTemplates = () => {
        selectorRef.current?.scrollIntoView({behavior: 'smooth'});
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleImportDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleImportDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!e.dataTransfer.files?.[0]) {
            return;
        }
        if (e.dataTransfer.files.length > 1) {
            addToast({
                content: formatMessage({defaultMessage: 'Can not import multiple files at once.'}),
                toastStyle: ToastStyle.Failure,
            });
            return;
        }
        importPlaybookFile(e.dataTransfer.files[0]);
    };

    let listBody: JSX.Element | JSX.Element[] | null = null;
    if (!hasPlaybooks && isFiltering) {
        listBody = (
            <EmptyState
                icon='search'
                data-testid='playbooks-no-match'
                title={formatMessage({defaultMessage: 'There are no playbooks matching those filters.'})}
            />
        );
    } else if (playbooks) {
        listBody = playbooks.map((p: Playbook) => (
            <PlaybookListRow
                key={p.id}
                playbook={p}
                onClick={() => view(p.id)}
                onEdit={() => edit(p.id)}
                onRestore={() => openConfirmRestoreModal({id: p.id, title: p.title})}
                onArchive={() => openConfirmArchiveModal(p)}
                onDuplicate={() => duplicatePlaybook(p.id).then(refreshLHS)}
                onMembershipChanged={() => fetchPlaybooks()}
                compact={compact}
            />
        ));
    }

    const makePlaybookList = () => {
        if (props.firstTimeUserExperience || (!hasPlaybooks && !isFiltering)) {
            return (
                <>
                    <NoContentPage
                        canCreatePlaybooks={canCreatePlaybooks}
                        scrollToNext={scrollToTemplates}
                    />
                    {inputImportPlaybook}
                </>
            );
        }

        return (
            <TableContainer>
                <Header
                    data-testid='titlePlaybook'
                    level={2}
                    heading={formatMessage({defaultMessage: 'Playbooks'})}
                    subtitle={formatMessage({defaultMessage: 'All the playbooks that you can access will show here'})}
                    right={(
                        <TitleActions>
                            {canCreatePlaybooks && (
                                <>
                                    <ImportButton
                                        onClick={handleImportClick}
                                    />
                                    {inputImportPlaybook}
                                    <HorizontalSpacer $size={12}/>
                                    <PlaybookModalButton/>
                                </>
                            )}
                        </TitleActions>
                    )}
                    style={{
                        borderBottom: '1px solid var(--am-line, rgba(var(--center-channel-color-rgb), 0.16))',
                    }}
                />
                <PlaybooksListFilters>
                    <SearchInput
                        testId={'search-filter'}
                        default={params.search_term}
                        onSearch={setSearchTerm}
                        placeholder={formatMessage({defaultMessage: 'Search for a playbook'})}
                    />
                    <HorizontalSpacer $size={12}/>
                    <CheckboxInput
                        testId={'with-archived'}
                        text={formatMessage({defaultMessage: 'With archived'})}
                        checked={params.with_archived}
                        onChange={setWithArchived}
                    />
                    <HorizontalSpacer $size={12}/>
                </PlaybooksListFilters>
                {!compact && (
                    <BackstageListHeader $edgeless={true}>
                        <div className='row'>
                            <div className='col-sm-4'>
                                <SortableColHeader
                                    name={formatMessage({defaultMessage: 'Name'})}
                                    direction={params.direction}
                                    active={params.sort === 'title'}
                                    onClick={() => sortBy('title')}
                                />
                            </div>
                            <div className='col-sm-2'>
                                <SortableColHeader
                                    name={formatMessage({defaultMessage: 'Last used'})}
                                    direction={params.direction}
                                    active={params.sort === 'last_run_at'}
                                    onClick={() => sortBy('last_run_at')}
                                />
                            </div>
                            <div className='col-sm-2'>
                                <SortableColHeader
                                    name={formatMessage({defaultMessage: 'Active Runs'})}
                                    direction={params.direction}
                                    active={params.sort === 'active_runs'}
                                    onClick={() => sortBy('active_runs')}
                                />
                            </div>
                            <div className='col-sm-2'>
                                <SortableColHeader
                                    name={formatMessage({defaultMessage: 'Runs'})}
                                    direction={params.direction}
                                    active={params.sort === 'runs'}
                                    onClick={() => sortBy('runs')}
                                />
                            </div>
                            <div className='col-sm-2'>
                                <FormattedMessage defaultMessage='Actions'/>
                            </div>
                        </div>
                    </BackstageListHeader>
                )}
                {listBody}
                <PaginationRow
                    page={params.page}
                    perPage={params.per_page}
                    totalCount={totalCount}
                    setPage={setPage}
                />
            </TableContainer>
        );
    };

    // If we don't have a bottomHalf, create it. Or if we're loading new playbooks, use the previous body.
    if (!content.current || !isLoading) {
        content.current = makePlaybookList();
    }

    return (
        <PlaybookListContainer>
            <FileUploadOverlay
                show={isDraggingFile}
                message={formatMessage({
                    defaultMessage: 'Drop a playbook export file to import it.',
                })}
                overlayType='center'
            />
            <ScrollContainer
                onDragEnter={handleImportDragEnter}
                onDragOver={handleImportDragOver}
                onDrop={handleImportDrop}
                data-testid='playbook-list-scroll-container'
            >
                {content.current}
                {canCreatePlaybooks && (
                    <>
                        <ContainerMedium
                            ref={selectorRef}
                        >
                            <TemplatesHeading className='am-app-h'>
                                {formatMessage({
                                    defaultMessage: 'Start from a template',
                                    description: 'Playbooks side panel: the heading of the list of templates a new playbook can start from.',
                                })}
                                <span className='am-grow'/>
                                {(props.firstTimeUserExperience || (!hasPlaybooks && !isFiltering)) && (
                                    <ImportLinkButton onClick={handleImportClick}>
                                        <FormattedMessage defaultMessage='Import'/>
                                    </ImportLinkButton>
                                )}
                            </TemplatesHeading>
                            <TemplateSelector
                                templates={props.firstTimeUserExperience || (!hasPlaybooks && !isFiltering) ? swapEnds(PresetTemplates) : PresetTemplates}
                            />
                        </ContainerMedium>
                    </>
                )}
                {confirmArchiveModal}
                {confirmRestoreModal}
            </ScrollContainer>
        </PlaybookListContainer>
    );
};

function swapEnds(arr: Array<any>) {
    return [arr[arr.length - 1], ...arr.slice(1, -1), arr[0]];
}

interface ImportButtonProps {
    onClick?: () => void;
}

const ImportButton = (props: ImportButtonProps) => {
    return (
        <TertiaryButton {...props}>
            <FormattedMessage defaultMessage='Import'/>
        </TertiaryButton>
    );
};

const ImportLinkButton = (props: PropsWithChildren<ImportButtonProps>) => {
    return (
        <ImportLink
            type='button'
            data-testid='playbooks-import-link'
            {...props}
        />
    );
};

const PlaybookModalButton = () => {
    const {formatMessage} = useIntl();
    const dispatch = useAppDispatch();

    return (
        <PrimaryButton
            onClick={() => dispatch(displayPlaybookCreateModal({}))}
        >
            <FusionIcon
                name='plus'
                size='sm'
            />
            {formatMessage({defaultMessage: 'Create playbook'})}
        </PrimaryButton>
    );
};

export default PlaybookList;
