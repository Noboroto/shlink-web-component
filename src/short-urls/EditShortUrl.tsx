import { Message, Result } from '@shlinkio/shlink-frontend-kit';
import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'react-external-link';
import { Card } from 'reactstrap';
import type { ShlinkEditShortUrlData } from '../api-contract';
import { ShlinkApiError } from '../common/ShlinkApiError';
import type { FCWithDeps } from '../container/utils';
import { componentFactory, useDependencies } from '../container/utils';
import { useSetting } from '../settings';
import { GoBackButton } from '../utils/components/GoBackButton';
import type { ShortUrlIdentifier } from './data';
import { shortUrlDataFromShortUrl } from './helpers';
import { useShortUrlIdentifier } from './helpers/hooks';
import type { EditShortUrl as EditShortUrlInfo, ShortUrlEdition } from './reducers/shortUrlEdition';
import type { ShortUrlsDetails } from './reducers/shortUrlsDetails';
import type { ShortUrlFormProps } from './ShortUrlForm';
import { fetchEmail } from '../../dev/helper/fetchEmail';
import { isAuthorized } from '../../dev/helper/isAuthorized';

type EditShortUrlProps = {
	shortUrlsDetails: ShortUrlsDetails;
	shortUrlEdition: ShortUrlEdition;
	getShortUrlsDetails: (identifiers: ShortUrlIdentifier[]) => void;
	editShortUrl: (editShortUrl: EditShortUrlInfo) => void;
};

type EditShortUrlDeps = {
	ShortUrlForm: FC<ShortUrlFormProps<ShlinkEditShortUrlData>>;
};

const EditShortUrl: FCWithDeps<EditShortUrlProps, EditShortUrlDeps> = (
	{ shortUrlsDetails, getShortUrlsDetails, shortUrlEdition, editShortUrl },
) => {
	const [canEdit, setCanEdit] = useState(false);
	const { ShortUrlForm } = useDependencies(EditShortUrl);
	const identifier = useShortUrlIdentifier();
	const { loading, error, errorData, shortUrls } = shortUrlsDetails;
	const shortUrl = identifier && shortUrls?.get(identifier);

	const { saving, saved, error: savingError, errorData: savingErrorData } = shortUrlEdition;
	const shortUrlCreationSettings = useSetting('shortUrlCreation');
	const initialState = useMemo(
		() => shortUrlDataFromShortUrl(shortUrl, shortUrlCreationSettings),
		[shortUrl, shortUrlCreationSettings],
	);

	useEffect(() => {
		fetchEmail().then((email) => {
			isAuthorized(email).then((isAuth) => {
				if (isAuth) {
					setCanEdit(true);
				}
				const urlTags = shortUrl?.tags;
				const userTags = email.split('@')[0];
				const createTime = shortUrl?.dateCreated
				if (!createTime) {
					setCanEdit(false);
					return;
				}
				const durationInHours = new Date().getHours() - new Date(createTime).getHours();
				if (durationInHours > 12) {
					setCanEdit(false);
					return;
				}
				if (urlTags && urlTags.includes(userTags)) {
					setCanEdit(true);
				}
			});
		});
	}, [shortUrl]);


	useEffect(() => {
		if (identifier) {
			getShortUrlsDetails([identifier]);
		}
	}, [getShortUrlsDetails, identifier]);

	if (loading) {
		return <Message loading />;
	}

	if (error) {
		return (
			<Result type="error">
				<ShlinkApiError errorData={errorData} fallbackMessage="An error occurred while loading short URL detail :(" />
			</Result>
		);
	}

	return (
		<>
			<header className="mb-3">
				<Card body>
					<h2 className="d-sm-flex justify-content-between align-items-center mb-0">
						<GoBackButton />
						<div className="text-center flex-grow-1">
							<small>Edit <ExternalLink href={shortUrl?.shortUrl ?? ''} /></small>
						</div>
					</h2>
				</Card>
			</header>
			{canEdit ? (<ShortUrlForm
				initialState={initialState}
				saving={saving}
				onSave={async (shortUrlData) => {
					if (shortUrl) {
						editShortUrl({ ...shortUrl, data: shortUrlData });
					}
				}}
			/>) : <Result type="error" className="mt-3">
				<ShlinkApiError errorData={savingErrorData} fallbackMessage="You have no permission to edit link" />
			</Result>}
			{saved && savingError && (
				<Result type="error" className="mt-3">
					<ShlinkApiError errorData={savingErrorData} fallbackMessage="An error occurred while updating short URL :(" />
				</Result>
			)}
			{saved && !savingError && <Result type="success" className="mt-3">Short URL properly edited.</Result>}
		</>
	);
};

export const EditShortUrlFactory = componentFactory(EditShortUrl, ['ShortUrlForm']);
