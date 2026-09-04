import assert from "node:assert/strict";
import { test } from "node:test";
import { erTillattSkillFil, parseSkillPack } from "./skill-pack.ts";

test("scripts og annen kode i skill-pakke ignoreres", () => {
  const skills = parseSkillPack(
    [
      {
        path: "pakke/SKILL.md",
        text: "---\nname: testskill\ndescription: En test\n---\n\nBruk meg.\n",
      },
      { path: "pakke/references/metode.md", text: "# Metode\n" },
      { path: "pakke/scripts/kjør.py", text: "print('nei')" },
      { path: "pakke/bin/hack.sh", text: "echo nei" },
      { path: "pakke/plugin.js", text: "export default {}" },
    ],
    { kilde: "plattform", kategori: "fag" },
  );
  assert.equal(skills.length, 1);
  assert.equal(skills[0]?.id, "testskill");
  assert.equal(skills[0]?.referanser.length, 1);
  assert.equal(skills[0]?.referanser[0]?.id, "metode");
});

test("erTillattSkillFil blokkerer scripts", () => {
  assert.equal(erTillattSkillFil("foo/SKILL.md"), true);
  assert.equal(erTillattSkillFil("foo/scripts/x.py"), false);
  assert.equal(erTillattSkillFil("../SKILL.md"), false);
  assert.equal(erTillattSkillFil("foo/run.js"), false);
});

test("pakke uten SKILL.md feiler", () => {
  assert.throws(
    () => parseSkillPack([{ path: "scripts/x.py", text: "x" }], { kilde: "plattform" }),
    /SKILL.md/,
  );
});
