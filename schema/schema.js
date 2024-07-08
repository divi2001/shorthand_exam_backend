// schema.js
const schema = {
    students: {
        student_id: 'BIGINT PRIMARY KEY',
        password: 'LONGTEXT',
        instituteId: 'BIGINT',
        batchNo: 'INT REFERENCES batchdb(batchNo)',
        batchdate: 'DATE',
        fullname: 'VARCHAR(100)',
        subjectId: 'INT REFERENCES subjectsdb(subjectId)',
        courseId: 'INT',
        batch_year: 'VARCHAR(100)',
        loggedin: 'BOOLEAN',
        done: 'BOOLEAN',
        photo: 'LONGTEXT',
        center: 'INT REFERENCES examcenterdb(center)',
        reporting_time: 'TIME',
        start_time: 'TIME',
        end_time: 'TIME',
        day: 'INT',
        qset: 'INT',
        // batchStartDate: 'DATE',
        // batchEndDate: 'DATE',
        // rem_time: 'INT'
        // firstName: 'VARCHAR(100)',
        // lastName: 'VARCHAR(100)',
        // motherName: 'VARCHAR(100)',
        // middleName: 'VARCHAR(100)',
        // mobile_no: 'INT(20)',
        // email: 'VARCHAR(100)',
    },
    subjectsdb: {
        subjectId: 'INT PRIMARY KEY',
        courseId: 'INT',
        subject_name: 'VARCHAR(100)',
        subject_name_short: 'VARCHAR(50)',
        daily_timer: 'INT',
        passage_timer: 'INT',
        demo_timer: 'INT'
    },
    studentlogs: {
        id: 'BIGINT PRIMARY KEY',
        student_id: 'BIGINT REFERENCES students(student_id)',
        center: 'INT REFERENCES examcenterdb(center)',
        loginTime: 'TIMESTAMP',
        login: 'BOOLEAN',
        trial_time: 'TIMESTAMP',
        audio1_time: 'TIMESTAMP',
        passage1_time: 'TIMESTAMP',
        audio2_time: 'TIMESTAMP',
        passage2_time: 'TIMESTAMP',
        feedback_time: 'TIMESTAMP'
    },
    loginlogs: {
        id: 'BIGINT PRIMARY KEY',
        student_id: 'BIGINT REFERENCES students(student_id), REFERENCES studentlogs(student_id)',
        login_time: 'TIMESTAMP',
        ip_address: 'VARCHAR(50)',
        disk_id: 'VARCHAR(100)',
        mac_address: 'VARCHAR(50)'
    },
    examcenterdb: {
        center: 'INT PRIMARY KEY',
        centerpass: 'LONGTEXT',
        center_name: 'VARCHAR(100)',
        center_address: 'VARCHAR(255)',
        pc_count: 'INT',
        max_pc: 'INT',
        attendanceroll: 'LONGTEXT',
        absenteereport: 'LONGTEXT',
        answersheet: 'LONGTEXT',
        blankanswersheet: 'LONGTEXT'
        // district: 'VARCHAR(100)',
        // taluka: 'VARCHAR(100)',
        // it_teacher_name: 'VARCHAR(100)',
        // mobile_no: 'INT(20)',
        // center_email: 'VARCHAR(100)',
        // dates: 'VARCHAR(255)',
        // remark: 'VARCHAR(255)',
        // checklist: 'VARCHAR(255)',
    },
    controllerdb: {
        center: 'INT REFERENCES examcenterdb(center)',
        batchNo: 'INT REFERENCES batchdb(batchNo)',
        controller_code: 'INT',
        controller_name: 'VARCHAR(100)',
        controller_contact: 'BIGINT',
        controller_email: 'VARCHAR(100)',
        controller_pass: 'LONGTEXT',
        district: 'VARCHAR(100)'
    },
    pcregistration: {
        id: 'INT AUTO_INCREMENT PRIMARY KEY',
        center: 'INT NOT NULL REFERENCES examcenterdb(center)',
        ip_address: 'LONGTEXT NOT NULL',
        disk_id: 'LONGTEXT NOT NULL',
        mac_address: 'LONGTEXT NOT NULL'
    },
    audiodb: {
        id: 'INT PRIMARY KEY',
        subjectId: 'INT REFERENCES subjectsdb(subjectId)',
        audio1: 'VARCHAR(255)',
        passage1: 'LONGTEXT',
        audio2: 'VARCHAR(255)',
        passage2: 'LONGTEXT',
        testaudio: 'VARCHAR(255)'
    },
    audiologs: {
        student_id: 'BIGINT PRIMARY KEY REFERENCES students(student_id), REFERENCES studentlogs(student_id)',
        trial: 'INT',
        passageA: 'INT',
        passageB: 'INT'
    },
    batchdb: {
        batchNo: 'INT PRIMARY KEY',
        batchdate: 'DATE',
        reporting_time: 'TIME',
        start_time: 'TIME',
        end_time: 'TIME',
        batchstatus: 'BOOLEAN'
    },
    feedbackdb: {
        student_id: 'BIGINT PRIMARY KEY REFERENCES students(student_id), REFERENCES studentlogs(student_id)',
        question1: 'LONGTEXT',
        question2: 'LONGTEXT',
        question3: 'LONGTEXT',
        question4: 'LONGTEXT',
        question5: 'LONGTEXT',
        question6: 'LONGTEXT',
        question7: 'LONGTEXT',
        question8: 'LONGTEXT',
        question9: 'LONGTEXT',
        question10: 'LONGTEXT'
    },
    textlogs: {
        student_id: 'BIGINT PRIMARY KEY REFERENCES students(student_id), REFERENCES studentlogs(student_id)',
        mina: 'DECIMAL',
        texta: 'LONGTEXT',
        minb: 'DECIMAL',
        textb: 'LONGTEXT',
        created_at: 'TIMESTAMP'
    },
    finalPassageSubmit: {
        student_id: 'BIGINT PRIMARY KEY REFERENCES students(student_id), REFERENCES studentlogs(student_id)',
        passageA: 'LONGTEXT',
        passageB: 'LONGTEXT'
    }
};

module.exports = schema;
