const MAX_WORD_SIZE = 20;
const MIN_WORD_SIZE = 2;

function onOpen() {
  const ui = DocumentApp.getUi();
  ui.createMenu('Tools')
    .addItem('Update Indices', 'updateIndexes')
    .addToUi();
}

function updateIndexes() {
  const doc = DocumentApp.getActiveDocument();

  const tabs = doc.getTabs(); // reads only principal tabs (indices are always inside them)
  const allTabs = [];

  const indexes = {
    words: { title: 'WORD INDEX', tab: null, paragraph: null, tabId: null, items: [] },
    idioms: { title: 'EXPRESSIONS INDEX', tab: null, paragraph: null, tabId: null, items: [] }
  };

  for (const tab of tabs) {
    allTabs.push({
      tab: tab,
      parentId: null
    });

    if (!indexes.words.tab || !indexes.idioms.tab) {
      try {
        const paragraphs = tab.asDocumentTab().getBody().getParagraphs();
        for (const paragraph of paragraphs) {
          const text = paragraph.getText().trim();
          for (const index of Object.values(indexes)) {

            if (!index.tab && text.startsWith(index.title)) {
              index.tab = tab;
              index.paragraph = paragraph;
              index.tabId = tab.getId();
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error reading tab', tab.getTitle());
      }
    }

    try {
      const subTabs = tab.getChildTabs();
      if (subTabs && subTabs.length > 0) {
        for (const subTab of subTabs) {
          allTabs.push({
            tab: subTab,
            parentId: tab.getId()
          });
        }
      }
    } catch (error) {
      console.error('Error reading children tabs', error);
    }
  }

  if (!indexes.words.tab || !indexes.idioms.tab) {
    DocumentApp.getUi().alert('Required index titles not found in the document:\nWORD INDEX\nEXPRESSIONS INDEX');
    return;
  }

  const seenWords = new Set();

  for (const { parentId, tab } of allTabs) {

    if (tab.getId() === indexes.words.tabId || tab.getId() === indexes.idioms.tabId) {
      continue;
    }
    try {
      const tabBody = tab.asDocumentTab().getBody();
      const tabParagraphs = tabBody.getParagraphs();

      for (let p = 0; p < tabParagraphs.length; p++) {
        let text = tabParagraphs[p].getText().trim();
        let coreIdea = '';

        // WORD in uppercase + /IPA - optional/ + (short note - optional) + stars
        if (text.match(/^[A-Z\-\/ ]+(\s+\/[^A-Z\/]+[^A-Z]*\/)?(\s+\([^)]*\))?\s*[⭐\s]+$/)) {
          
          const textParts = text.split(/\s+\/[^A-Z\/]+[^A-Z]*\/|\s*[(⭐]/);
          const word = textParts[0].trim();

          if (word && word.length >= MIN_WORD_SIZE && word.length <= MAX_WORD_SIZE) {
            if (word === word.toUpperCase()) {

              if (seenWords.has(word)) continue;

              if (p + 1 < tabParagraphs.length) {
                const textBelow = tabParagraphs[p + 1].getText().trim();
                if (textBelow.startsWith('💡') || textBelow.startsWith('🧠') || textBelow.startsWith('🔊'))
                  coreIdea = ' (' + textBelow.replace(/^[💡🧠🔊]+\s*/, '') + ')';
              }

              const indexType = parentId === indexes.idioms.tabId ? 'idioms' : 'words';

              indexes[indexType].items.push({
                text: word,
                coreIdea,
                tabId: tab.getId()
              });
              seenWords.add(word);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error parsing tab', tab.getTitle(), error);
    }
  }

  for (const index of Object.values(indexes)) {
    const items = index.items;
    const indexParagraph = index.paragraph;

    items.sort((a, b) => a.text.localeCompare(b.text));

    let indexOutput = index.title + '\n\n';
    for (const item of items) {
      indexOutput += item.text + item.coreIdea + '    |    ';
    }
    indexParagraph.setText(indexOutput);

    for (const item of items) {

      let searchResult = indexParagraph.findText(item.text);

      while (searchResult) {
        const start = searchResult.getStartOffset();
        const end = searchResult.getEndOffsetInclusive();
        const textElement = searchResult.getElement().asText();

        const textBefore = textElement.getText().substring(0, start).trim();
        const textAfter = textElement.getText().substring(end + 1).trim();

        const isolatedWord = (textBefore.endsWith('|') || textBefore.endsWith(index.title)) &&
          (textAfter.startsWith('|') || textAfter.startsWith('('));

        if (isolatedWord) {
          const url = 'https://docs.google.com/document/d/' + doc.getId() + '/edit?tab=' + item.tabId;
          textElement.setLinkUrl(start, end, url);
          break;
        }
        searchResult = indexParagraph.findText(item.text, searchResult);
      }
    }
  }

  DocumentApp.getUi().alert('Word & Expressions Indices Updated!');
}
