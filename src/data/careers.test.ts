import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  careerSalaryLine,
  careerStartLabel,
  careers,
  getCareer,
  jobPostingJsonLd,
} from "./careers";

describe("career salary lines", () => {
  test("CMO is a monthly minimum with the experience note", () => {
    const cmo = getCareer("cmo");
    assert.ok(cmo);
    assert.equal(cmo.salary.kind, "from-base");
    assert.equal(
      careerSalaryLine(cmo, "sk"),
      "Mzda: od 2 800 € hrubého mesačne (základná zložka), podľa znalostí a skúseností.",
    );
    assert.equal(
      careerSalaryLine(cmo, "en"),
      "Salary: from €2,800 gross per month (base), depending on knowledge and experience.",
    );
  });

  test("admin pay is the exact hourly rate, with no annual total", () => {
    const admin = getCareer("admin-assistant");
    assert.ok(admin);
    assert.equal(admin.salary.kind, "hourly-base");
    assert.equal(
      careerSalaryLine(admin, "sk"),
      "Odmena: 5,259 € hrubého za hodinu (základná odmena). Vypláca sa za vykonanú prácu, v rozsahu najviac 350 hodín v kalendárnom roku.",
    );
    assert.equal(
      careerSalaryLine(admin, "en"),
      "Pay: €5.259 gross per hour (base). Paid for work performed, up to 350 hours per calendar year.",
    );
    assert.equal(careerSalaryLine(admin, "sk").includes("5,26"), false);
    assert.equal(careerSalaryLine(admin, "en").includes("5.26"), false);
  });

  test("developer pay is a monthly minimum", () => {
    const developer = getCareer("ai-developer");
    assert.ok(developer);
    assert.equal(
      careerSalaryLine(developer, "sk"),
      "Mzda: od 3 000 € hrubého mesačne (základná zložka), podľa skúseností a zručností.",
    );
    assert.equal(
      careerSalaryLine(developer, "en"),
      "Salary: from €3,000 gross per month (base), depending on skills and experience.",
    );
  });
});

describe("career start labels", () => {
  test("CMO start date formats from the ISO value", () => {
    const cmo = getCareer("cmo");
    assert.ok(cmo);
    assert.equal(careerStartLabel(cmo, "sk"), "1. 1. 2027");
    assert.equal(careerStartLabel(cmo, "en"), "1 January 2027");
  });

  test("admin start stays open", () => {
    const admin = getCareer("admin-assistant");
    assert.ok(admin);
    assert.equal(careerStartLabel(admin, "sk"), "Dohodou");
    assert.equal(careerStartLabel(admin, "en"), "By agreement");
  });
});

describe("JobPosting JSON-LD", () => {
  test("maps each salary kind onto schema.org", () => {
    const cmo = getCareer("cmo");
    const admin = getCareer("admin-assistant");
    const developer = getCareer("ai-developer");
    assert.ok(cmo && admin && developer);

    const cmoLd = JSON.parse(jobPostingJsonLd(cmo, "sk")) as {
      baseSalary: { value: { minValue?: number; value?: number; unitText: string } };
    };
    assert.equal(cmoLd.baseSalary.value.minValue, 2800);
    assert.equal(cmoLd.baseSalary.value.unitText, "MONTH");
    assert.equal("value" in cmoLd.baseSalary.value, false);

    const devLd = JSON.parse(jobPostingJsonLd(developer, "en")) as {
      baseSalary: { value: { minValue?: number; unitText: string } };
      employmentType: string[];
    };
    assert.equal(devLd.baseSalary.value.minValue, 3000);
    assert.equal(devLd.baseSalary.value.unitText, "MONTH");
    assert.deepEqual(devLd.employmentType, ["FULL_TIME", "CONTRACTOR"]);

    const adminLd = JSON.parse(jobPostingJsonLd(admin, "sk")) as {
      baseSalary: { value: { value: number; unitText: string } };
      employmentType: string[];
      description: string;
    };
    assert.equal(adminLd.baseSalary.value.value, 5.259);
    assert.equal(adminLd.baseSalary.value.unitText, "HOUR");
    assert.deepEqual(adminLd.employmentType, ["TEMPORARY", "PART_TIME"]);
    assert.match(adminLd.description, /5,259/);
    assert.equal(/\d[\d\s]*\s*€/.test(adminLd.description.replace("5,259 €", "")), false);
  });

  test("developer copy does not lock a stack", () => {
    const developer = getCareer("ai-developer");
    assert.ok(developer);
    const blob = JSON.stringify({
      teaser: developer.teaser,
      pitch: developer.pitch,
      responsibilities: developer.responsibilities,
      lookingFor: developer.lookingFor,
    });
    for (const fixed of ["TypeScript", "Next.js", "Postgres", "Cursor"]) {
      assert.equal(blob.includes(fixed), false, fixed);
    }
    assert.match(developer.teaser.sk, /Nástroje volíme podľa projektu/);
    assert.match(developer.teaser.en, /pick the tools per project/);
  });

  test("lists every open role", () => {
    assert.deepEqual(
      careers.map((role) => role.slug),
      ["cmo", "admin-assistant", "ai-developer"],
    );
  });
});
