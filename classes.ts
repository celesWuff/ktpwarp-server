import { AUTO_FETCH_CLASSES, IGNORED_CLASS_IDS, 签到_CLASSES } from "./config";
import { getAuthenticatedHeaders, getReqtimestamp } from "./util";
import { credentials } from "./auth";
import { 签到ClassType } from "./types";
import axiosRetry from "axios-retry";
import axios from "axios";

axiosRetry(axios, { retries: 3 });

export let classes: 签到ClassType[] = [];

export async function fetchClasses() {
  if (AUTO_FETCH_CLASSES) {
    let fetchedClasses: 签到ClassType[] = [];

    console.log("[classes] Auto-fetching classes...");

    const headers = getAuthenticatedHeaders(credentials[0]);

    const responsePartOne = await axios.post(
      "https://openapiv5.ketangpai.com/courseApi/semesterList",
      {
        isstudy: "1",
        search: "",
        reqtimestamp: getReqtimestamp(),
      },
      { headers }
    );

    for (const semester of responsePartOne.data.data.semester) {
      const responsePartTwo = await axios.post(
        "https://openapiv5.ketangpai.com/CourseApi/semesterCourseList",
        {
          isstudy: "1",
          search: "",
          semester: semester.semester,
          term: semester.term,
          reqtimestamp: getReqtimestamp(),
        },
        { headers }
      );

      responsePartTwo.data.data.map((class_: any) => {
        fetchedClasses.push({
          friendlyName: class_.coursename,
          classId: class_.id,
        });
      });
    }

    classes = 签到_CLASSES;

    const CLASS_IDS_FROM_CONFIG = 签到_CLASSES.map((class_) => class_.classId);

    for (const class_ of fetchedClasses) {
      if (IGNORED_CLASS_IDS.includes(class_.classId)) {
        console.log(`[classes] Ignoring class ${class_.friendlyName} (${class_.classId})`);
      } else if (!CLASS_IDS_FROM_CONFIG.includes(class_.classId)) {
        classes.push(class_);
      }
    }
  } else {
    console.log("[classes] Using classes from config");
    classes = 签到_CLASSES;
  }

  console.log(`[classes] Fetched ${classes.length} class(es)`);
}
