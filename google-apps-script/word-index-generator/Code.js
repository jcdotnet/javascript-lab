const MAX_WORD_SIZE = 20;

function onOpen() {
  const ui = DocumentApp.getUi();
  ui.createMenu('Tools')
    .addItem('Update Word Index', 'updateWordIndex')
    .addToUi();
}

function updateWordIndex() {
  const doc = DocumentApp.getActiveDocument();
  const foundWords = [];

  const tabs = doc.getTabs(); // reads only principal tabs
  const allTabs = [];

  let indexTab = null;
  let indexParagraph = null;

  for (const tab of tabs) {
    allTabs.push(tab);

    if (!indexTab) {
      try {
        const paragraphs = tab.asDocumentTab().getBody().getParagraphs();
        for (const paragraph of paragraphs) {
          if (paragraph.getText().trim().startsWith('WORD INDEX')) {
            indexTab = tab;
            indexParagraph = paragraph;
            break;
          }
        }
      } catch (error) {
        console.error('Skipping non-document or unreadable tab:', tab.getTitle());
      }
    }

    try {
      const subTabs = tab.getChildTabs();
      if (subTabs && subTabs.length > 0) {
        for (const subTab of subTabs) {
          allTabs.push(subTab);
        }
      }
    } catch (error) {
      console.error('Error reading tabs', error);
    }
  }

  if (!indexParagraph) {
    DocumentApp.getUi().alert('Please create a paragraph with the exact index title: WORD INDEX');
    return;
  }

  const seenWords = new Set();

  for (const tab of allTabs) {
    const tabTitle = tab.getTitle().toLowerCase();

    if (tab.getId() === indexTab.getId()) continue;

    try {
      const tabBody = tab.asDocumentTab().getBody();
      const tabParagraphs = tabBody.getParagraphs();

      for (let p = 0; p < tabParagraphs.length; p++) {
        let text =  tabParagraphs[p].getText().trim();
        let coreIdea = '';

        if (text.match(/^[A-Z\- ]+\s+\/[^\/]+\/\s+⭐/i)) { // word + IPA + stars

          const textParts = text.split('/')
          const word = textParts[0].trim();

          if (word && word.length > 2 && word.length < MAX_WORD_SIZE) {
            if (word === word.toUpperCase()) {

              if (seenWords.has(word)) continue;

              if (p + 1 < tabParagraphs.length) {
                const textBelow = tabParagraphs[p + 1].getText().trim();
                if (textBelow.startsWith('💡') || textBelow.startsWith('🧠'))
                  coreIdea = ' (' + textBelow.replace(/^[💡🧠]+\s*/, '') + ')';
              }

              foundWords.push({
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

  foundWords.sort((a, b) => a.text.localeCompare(b.text));

  let indexOutput = 'WORD INDEX\n\n'; 
  for (const foundWord of foundWords) {
    indexOutput += foundWord.text + foundWord.coreIdea + '    |    ';
  }

  indexParagraph.setText(indexOutput);

  for (const foundWord of foundWords) {
    let searchResult = indexParagraph.findText(foundWord.text);

    while (searchResult) {
      const start = searchResult.getStartOffset();
      const end = searchResult.getEndOffsetInclusive();
      const textElement = searchResult.getElement().asText();

      const textBefore = textElement.getText().substring(0, start).trim();
      const textAfter = textElement.getText().substring(end + 1).trim();

      const isolatedWord = (textBefore.endsWith("|") || textBefore.endsWith('WORD INDEX')) &&
        textAfter.startsWith('|') || textAfter.startsWith('(');

      if (isolatedWord) {
        const url = 'https://docs.google.com/document/d/' + doc.getId() + '/edit?tab=' + foundWord.tabId;
        textElement.setLinkUrl(start, end, url);
        break;
      }
      searchResult = indexParagraph.findText(foundWord.text, searchResult);
    }
  }

  DocumentApp.getUi().alert('Word Index Updated!');
}
