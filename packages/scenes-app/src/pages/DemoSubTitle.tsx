import { Button, CodeEditor, Icon, Modal, useStyles2 } from '@grafana/ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { CopyToClipboard } from '../components/CopyToClipboard';

function getStyles(theme: GrafanaTheme2, titleHeight: number, bodyHeight: number) {
  return {
    subTitleRow: css({
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing(2),
    }),
    modalContent: css({
      width: '70%',
    }),
    bodyContent: css({
      height: `${bodyHeight}px`,
    }),
    wrapper: css({
      display: 'flex',
      height: `calc(100% - ${titleHeight}px)`,
      flexDirection: 'column',
      gap: theme.spacing(2),
    }),
    codeEditor: css({
      flexGrow: 1,
    }),
    textCopyRow: css({
      display: 'flex',
      justifyContent: 'space-between',
      width: '100%',
      gap: theme.spacing(1),
      alignItems: 'flex-end',
      paddingBottom: theme.spacing(1),
    }),
    copyText: css({
      display: 'flex',
      flexDirection: 'row',
      gap: theme.spacing(1),
      alignItems: 'center',

      svg: {
        fill: theme.colors.text.link,
      },
      span: {
        color: theme.colors.text.link,
      },
    }),
    checkIcon: css({
      display: 'flex',
      flexDirection: 'row',
      gap: theme.spacing(1),
      alignItems: 'center',

      svg: {
        fill: theme.colors.success.text,
      },
      span: {
        color: theme.colors.success.text,
      },
    }),
  };
}

type Props = {
  text: string;
  getSourceCodeModule: () => Promise<any>;
};

export const DemoSubTitle = ({ text, getSourceCodeModule }: Props) => {
  const [titleHeight, setTitleHeight] = useState<number>(24);
  const [bodyHeight, setBodyHeight] = useState<number>(500);
  const textRef = useRef<HTMLDivElement>(null);
  const styles = useStyles2((theme) => getStyles(theme, titleHeight, bodyHeight));
  const [fileContent, setFileContent] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopySuccessful, setIsCopySuccessful] = useState(false);

  const openSourceCode = useCallback(async () => {
    const module = await getSourceCodeModule?.();
    setFileContent(module.default);
  }, [getSourceCodeModule]);

  const handleResize = useCallback(() => {
    setFileContent('');
    setTitleHeight(textRef?.current?.offsetHeight ?? 24);
    if (window.innerHeight <= 440) {
      setBodyHeight(100);
    } else if (window.innerHeight > 440 && window.innerHeight <= 560) {
      setBodyHeight(200);
    } else if (window.innerHeight > 560 && window.innerHeight <= 760) {
      setBodyHeight(300);
    } else if (window.innerHeight > 760 && window.innerHeight <= 820) {
      setBodyHeight(440);
    } else {
      setBodyHeight(500);
    }
    openSourceCode();
  }, [openSourceCode]);

  useEffect(() => {
    if (fileContent && !isModalOpen) {
      setIsModalOpen(true);
    }
  }, [fileContent, isModalOpen]);

  useEffect(() => {
    if (isModalOpen && textRef?.current) {
      handleResize();
      window.addEventListener('resize', handleResize);
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [isModalOpen, handleResize]);

  function onModalClose() {
    setFileContent('');
    setIsModalOpen(false);
  }

  function onClipboardCopy() {
    setIsCopySuccessful(true);

    setTimeout(() => setIsCopySuccessful(false), 3000);
  }

  return (
    <div className={styles.subTitleRow}>
      <span>{text}</span>
      <Button variant={'secondary'} tooltip={'View Source code'} onClick={openSourceCode}>
        {'</>'}
      </Button>
      <Modal className={styles.modalContent} title={'Demo source code'} isOpen={isModalOpen} onDismiss={onModalClose}>
        <div className={styles.bodyContent}>
          <div ref={textRef} className={styles.textCopyRow}>
            <p>{text}</p>
            {fileContent && (
              <CopyToClipboard
                onClipboardCopy={onClipboardCopy}
                onClipboardError={() => setIsCopySuccessful(false)}
                clipboardText={fileContent}
                fill="text"
              >
                {!isCopySuccessful ? (
                  <div className={styles.copyText}>
                    <Icon name="copy" />
                    <span>Copy to clipboard</span>
                  </div>
                ) : (
                  <div className={styles.checkIcon}>
                    <Icon name="check" />
                    <span>copied!</span>
                  </div>
                )}
              </CopyToClipboard>
            )}
          </div>
          {fileContent && (
            <div className={styles.wrapper}>
              <CodeEditor
                showLineNumbers={true}
                language="typescript"
                value={fileContent?.trim() ?? ''}
                readOnly={true}
                containerStyles={styles.codeEditor}
              />
            </div>
          )}
        </div>
        <Modal.ButtonRow>
          <Button variant="primary" fill="solid" onClick={onModalClose}>
            OK
          </Button>
        </Modal.ButtonRow>
      </Modal>
    </div>
  );
};
