import grammar from "../../data/grammar.json";
import listening from "../../data/listening.json";
import reading from "../../data/reading.json";
import resources from "../../data/resources.json";
import tests from "../../data/tests.json";
import vocab from "../../data/vocab.json";

export const modules = {
  grammar,
  listening,
  reading,
  test: tests
};

export { resources, vocab };

export function getVocabMeta() {
  const levels = Object.entries(vocab).map(([level, topics]) => {
    const topicEntries = Object.entries(topics).map(([topic, items]) => ({
      topic,
      count: items.length
    }));

    return {
      level,
      count: topicEntries.reduce((sum, item) => sum + item.count, 0),
      topics: topicEntries
    };
  });

  return {
    total: levels.reduce((sum, item) => sum + item.count, 0),
    levels
  };
}

export function getVocabItems(level, topic, search = "") {
  const levelData = vocab[level];
  if (!levelData) return [];

  const topicData = levelData[topic];
  if (!topicData) return [];

  const keyword = search.trim().toLowerCase();
  if (!keyword) return topicData;

  return topicData.filter((item) =>
    [item.word, item.gender, item.pos, item.vi, item.en, item.ipa, item.example]
      .join(" ")
      .toLowerCase()
      .includes(keyword)
  );
}
