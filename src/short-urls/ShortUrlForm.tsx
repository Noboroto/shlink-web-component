import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faAndroid, faApple } from '@fortawesome/free-brands-svg-icons';
import { faDesktop } from '@fortawesome/free-solid-svg-icons';
import { Checkbox, SimpleCard } from '@shlinkio/shlink-frontend-kit';
import { clsx } from 'clsx';
import { parseISO } from 'date-fns';
import type { ChangeEvent, FC } from 'react';
import { useEffect, useState } from 'react';
import { Button, FormGroup, Input, Row } from 'reactstrap';
import type { InputType } from 'reactstrap/types/lib/Input';
import type { ShlinkCreateShortUrlData, ShlinkDeviceLongUrls, ShlinkEditShortUrlData } from '../api-contract';
import type { FCWithDeps } from '../container/utils';
import { componentFactory, useDependencies } from '../container/utils';
import type { DomainSelectorProps } from '../domains/DomainSelector';
import type { TagsSelectorProps } from '../tags/helpers/TagsSelector';
import type { TagsList } from '../tags/reducers/tagsList';
import { IconInput } from '../utils/components/IconInput';
import type { DateTimeInputProps } from '../utils/dates/DateTimeInput';
import { DateTimeInput } from '../utils/dates/DateTimeInput';
import { formatIsoDate } from '../utils/dates/helpers/date';
import { useFeature } from '../utils/features';
import { handleEventPreventingDefault, hasValue } from '../utils/helpers';
import { ShortUrlFormCheckboxGroup } from './helpers/ShortUrlFormCheckboxGroup';
import { UseExistingIfFoundInfoIcon } from './UseExistingIfFoundInfoIcon';
import './ShortUrlForm.scss';

export type Mode = 'create' | 'create-basic' | 'edit';

type DateFields = 'validSince' | 'validUntil';
type NonDateFields = 'longUrl' | 'customSlug' | 'shortCodeLength' | 'domain' | 'maxVisits' | 'title';

export interface ShortUrlFormProps<T extends ShlinkCreateShortUrlData | ShlinkEditShortUrlData> {
  // FIXME Try to get rid of the mode param, and infer creation or edition from initialState if possible
  mode: Mode;
  saving: boolean;
  initialState: T;
  onSave: (shortUrlData: T) => Promise<unknown>;
}

type ShortUrlFormConnectProps = ShortUrlFormProps<ShlinkCreateShortUrlData | ShlinkEditShortUrlData> & {
  tagsList: TagsList;
};

type ShortUrlFormDeps = {
  TagsSelector: FC<TagsSelectorProps>;
  DomainSelector: FC<DomainSelectorProps>;
};

const toDate = (date?: string | Date): Date | undefined => (typeof date === 'string' ? parseISO(date) : date);

const isCreationData = (data: ShlinkCreateShortUrlData | ShlinkEditShortUrlData): data is ShlinkCreateShortUrlData =>
  'shortCodeLength' in data && 'customSlug' in data && 'domain' in data;

const isErrorAction = (action: any): boolean => 'error' in action;

const ShortUrlForm: FCWithDeps<ShortUrlFormConnectProps, ShortUrlFormDeps> = (
  { mode, saving, onSave, initialState, tagsList },
) => {
  const { TagsSelector, DomainSelector } = useDependencies(ShortUrlForm as unknown as ShortUrlFormDeps);
  const [shortUrlData, setShortUrlData] = useState(initialState);
  const reset = () => setShortUrlData(initialState);
  const supportsDeviceLongUrls = useFeature('deviceLongUrls');

  const isEdit = mode === 'edit';
  const isCreation = isCreationData(shortUrlData);
  const isBasicMode = mode === 'create-basic';
  const changeTags = (tags: string[]) => setShortUrlData((prev) => ({ ...prev, tags }));
  const setResettableValue = (value: string, initialValue?: any) => {
    if (hasValue(value)) {
      return value;
    }

    // If an initial value was provided for this when the input is "emptied", explicitly set it to null so that the
    // value gets removed. Otherwise, set undefined so that it gets ignored.
    return hasValue(initialValue) ? null : undefined;
  };
  const submit = handleEventPreventingDefault(async () => onSave({
    ...shortUrlData,
    validSince: formatIsoDate(shortUrlData.validSince) ?? null,
    validUntil: formatIsoDate(shortUrlData.validUntil) ?? null,
    maxVisits: !hasValue(shortUrlData.maxVisits) ? null : Number(shortUrlData.maxVisits),
  }).then((result: any) => !isEdit && !isErrorAction(result) && reset()).catch(() => {}));

  useEffect(() => {
    setShortUrlData(initialState);
  }, [initialState]);

  // TODO Consider extracting these functions to local components
  const renderOptionalInput = (
    id: NonDateFields,
    placeholder: string,
    type: InputType = 'text',
    props: any = {},
    fromGroupProps = {},
  ) => (
    <FormGroup {...fromGroupProps}>
      <Input
        name={id}
        id={id}
        type={type}
        placeholder={placeholder}
        // @ts-expect-error FIXME Make sure id is a key from T
        value={shortUrlData[id] ?? ''}
        onChange={props.onChange ?? ((e) => setShortUrlData((prev) => ({ ...prev, [id]: e.target.value })))}
        {...props}
      />
    </FormGroup>
  );
  const renderDeviceLongUrlInput = (id: keyof ShlinkDeviceLongUrls, placeholder: string, icon: IconProp) => (
    <IconInput
      icon={icon}
      name={id}
      id={id}
      type="url"
      placeholder={placeholder}
      value={shortUrlData.deviceLongUrls?.[id] ?? ''}
      onChange={(e) => setShortUrlData((prev) => ({
        ...prev,
        deviceLongUrls: {
          ...(prev.deviceLongUrls ?? {}),
          [id]: setResettableValue(e.target.value, initialState.deviceLongUrls?.[id]),
        },
      }))}
    />
  );
  const renderDateInput = (id: DateFields, placeholder: string, props: Partial<DateTimeInputProps> = {}) => (
    <DateTimeInput
      {...props}
      name={id}
      placeholder={placeholder}
      value={shortUrlData[id] ? toDate(shortUrlData[id] as string | Date) : null}
      onChange={(date: Date | null) => setShortUrlData((prev) => ({ ...prev, [id]: date }))}
    />
  );
  const basicComponents = (
    <>
      <FormGroup>
        <Input
          name="longUrl"
          bsSize="lg"
          type="url"
          placeholder="URL to be shortened"
          required
          value={shortUrlData.longUrl}
          onChange={(e) => setShortUrlData((prev) => ({ ...prev, longUrl: e.target.value }))}
        />
      </FormGroup>
      <Row>
        {isBasicMode && renderOptionalInput('customSlug', 'Custom slug', 'text', { bsSize: 'lg' }, { className: 'col-lg-6' })}
        <div className={isBasicMode ? 'col-lg-6 mb-3' : 'col-12'}>
          <TagsSelector tags={tagsList.tags} selectedTags={shortUrlData.tags ?? []} onChange={changeTags} />
        </div>
      </Row>
    </>
  );

  return (
    <form name="shortUrlForm" className="short-url-form" onSubmit={submit}>
      {isBasicMode && basicComponents}
      {!isBasicMode && (
        <>
          <Row>
            <div className={clsx('mb-3', { 'col-sm-6': supportsDeviceLongUrls, 'col-12': !supportsDeviceLongUrls })}>
              <SimpleCard title="Main options" className="mb-3">
                {basicComponents}
              </SimpleCard>
            </div>
            {supportsDeviceLongUrls && (
              <div className="col-sm-6 mb-3">
                <SimpleCard title="Device-specific long URLs">
                  <FormGroup>
                    {renderDeviceLongUrlInput('android', 'Android-specific redirection', faAndroid)}
                  </FormGroup>
                  <FormGroup>
                    {renderDeviceLongUrlInput('ios', 'iOS-specific redirection', faApple)}
                  </FormGroup>
                  {renderDeviceLongUrlInput('desktop', 'Desktop-specific redirection', faDesktop)}
                </SimpleCard>
              </div>
            )}
          </Row>

          <Row>
            <div className="col-sm-6 mb-3">
              <SimpleCard title="Customize the short URL">
                {renderOptionalInput('title', 'Title', 'text', {
                  onChange: ({ target }: ChangeEvent<HTMLInputElement>) => setShortUrlData((prev) => ({
                    ...prev,
                    title: setResettableValue(target.value, initialState.title),
                  })),
                })}
                {!isEdit && isCreation && (
                  <>
                    <Row>
                      <div className="col-lg-6">
                        {renderOptionalInput('customSlug', 'Custom slug', 'text', {
                          disabled: hasValue(shortUrlData.shortCodeLength),
                        })}
                      </div>
                      <div className="col-lg-6">
                        {renderOptionalInput('shortCodeLength', 'Short code length', 'number', {
                          min: 4,
                          disabled: hasValue(shortUrlData.customSlug),
                        })}
                      </div>
                    </Row>
                    <DomainSelector
                      value={shortUrlData.domain}
                      onChange={(domain?: string) => setShortUrlData((prev) => ({ ...prev, domain }))}
                    />
                  </>
                )}
              </SimpleCard>
            </div>

            <div className="col-sm-6 mb-3">
              <SimpleCard title="Limit access to the short URL">
                {renderOptionalInput('maxVisits', 'Maximum number of visits allowed', 'number', { min: 1 })}
                <div className="mb-3">
                  {renderDateInput('validSince', 'Enabled since...', { maxDate: shortUrlData.validUntil ? toDate(shortUrlData.validUntil) : undefined })}
                </div>
                {renderDateInput('validUntil', 'Enabled until...', { minDate: shortUrlData.validSince ? toDate(shortUrlData.validSince) : undefined })}
              </SimpleCard>
            </div>
          </Row>

          <Row>
            <div className="col-sm-6 mb-3">
              <SimpleCard title="Extra checks">
                <ShortUrlFormCheckboxGroup
                  infoTooltip="If checked, Shlink will try to reach the long URL, failing in case it's not publicly accessible."
                  checked={shortUrlData.validateUrl}
                  onChange={(validateUrl) => setShortUrlData((prev) => ({ ...prev, validateUrl }))}
                >
                  Validate URL
                </ShortUrlFormCheckboxGroup>
                {!isEdit && isCreation && (
                  <p>
                    <Checkbox
                      inline
                      className="me-2"
                      checked={shortUrlData.findIfExists}
                      onChange={(findIfExists) => setShortUrlData((prev) => ({ ...prev, findIfExists }))}
                    >
                      Use existing URL if found
                    </Checkbox>
                    <UseExistingIfFoundInfoIcon />
                  </p>
                )}
              </SimpleCard>
            </div>
            <div className="col-sm-6 mb-3">
              <SimpleCard title="Configure behavior">
                <ShortUrlFormCheckboxGroup
                  infoTooltip="This short URL will be included in the robots.txt for your Shlink instance, allowing web crawlers (like Google) to index it."
                  checked={shortUrlData.crawlable}
                  onChange={(crawlable) => setShortUrlData((prev) => ({ ...prev, crawlable }))}
                >
                  Make it crawlable
                </ShortUrlFormCheckboxGroup>
                <ShortUrlFormCheckboxGroup
                  infoTooltip="When this short URL is visited, any query params appended to it will be forwarded to the long URL."
                  checked={shortUrlData.forwardQuery}
                  onChange={(forwardQuery) => setShortUrlData((prev) => ({ ...prev, forwardQuery }))}
                >
                  Forward query params on redirect
                </ShortUrlFormCheckboxGroup>
              </SimpleCard>
            </div>
          </Row>
        </>
      )}

      <div className="text-center">
        <Button
          outline
          color="primary"
          disabled={saving || !shortUrlData.longUrl}
          className="btn-xs-block"
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
};

export const ShortUrlFormFactory = componentFactory(ShortUrlForm, ['TagsSelector', 'DomainSelector']);
