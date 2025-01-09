import { Button, Modal, useStyles2 } from '@grafana/ui';
import React, { useEffect, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { HighlightCode } from '../components/HighlightCode/HighlightCode';

function getStyles(theme: GrafanaTheme2) {
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
      height: '500px',
      overflowY: 'auto',
    }),
  };
}

type Props = {
  text: string;
  getSourceCodeModule: () => Promise<any>;
}

export const DemoSubTitle = ({ text, getSourceCodeModule }: Props) => {
  const styles = useStyles2(getStyles);
  const [fileContent, setFileContent] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (fileContent) {
      setIsModalOpen(true);
    }
  }, [fileContent]);

  async function openSourceCode() {
    const module = await getSourceCodeModule?.();
    setFileContent(module.default);
  }

  function onModalClose() {
    setFileContent('');
    setIsModalOpen(false);
  }

  return <div className={styles.subTitleRow}>
    <span>{text}</span>
    <Button variant={'secondary'} tooltip={'View Source code'} onClick={openSourceCode}>{'</>'}</Button>
    <Modal className={styles.modalContent} title={'Demo source code'} isOpen={isModalOpen} onDismiss={onModalClose}>
      <div className={styles.bodyContent}>
        <p>{text}</p>
        <HighlightCode
          code={fileContent?.trim() ?? ''}
          language='typescript'
          plugins={['line-numbers', 'toolbar']}
        />
      </div>
      <Modal.ButtonRow>
        <Button variant='primary' fill='solid' onClick={onModalClose}>OK</Button>
      </Modal.ButtonRow>
    </Modal>
  </div>;
};
