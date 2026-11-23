package com.jobtracker.service;

import com.jobtracker.model.JobApplication;
import com.jobtracker.model.Status;
import com.jobtracker.repository.JobApplicationRepository;
import com.jobtracker.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/** Runs on a cron schedule: emails each user about applications whose follow-up date has arrived. */
@Component
public class ReminderJob {
    private static final Logger log = LoggerFactory.getLogger(ReminderJob.class);

    private final JobApplicationRepository repo; private final UserRepository users;
    private final ObjectProvider<JavaMailSender> mailSender;
    @Value("${app.mail-from}") private String from;

    public ReminderJob(JobApplicationRepository repo, UserRepository users, ObjectProvider<JavaMailSender> mailSender) {
        this.repo = repo; this.users = users; this.mailSender = mailSender;
    }

    @Scheduled(cron = "${app.reminder-cron}")
    public void sendDueReminders() {
        List<JobApplication> due = repo.findByFollowUpDateLessThanEqualAndReminderSentFalseAndStatusIn(
                LocalDate.now(), List.of(Status.APPLIED, Status.INTERVIEW));
        JavaMailSender sender = mailSender.getIfAvailable();

        for (JobApplication a : due) {
            users.findById(a.getOwnerId()).ifPresent(u -> {
                String text = "Time to follow up on your application for " + a.getJobTitle() + " at " + a.getCompany() + ".";
                try {
                    if (sender == null) {
                        log.info("Reminder for {}: {}", u.getEmail(), text);
                    } else {
                        SimpleMailMessage m = new SimpleMailMessage();
                        m.setFrom(from); m.setTo(u.getEmail());
                        m.setSubject("Follow up with " + a.getCompany());
                        m.setText(text);
                        sender.send(m);
                    }
                    a.setReminderSent(true);
                    repo.save(a);
                } catch (Exception e) {
                    log.warn("Could not send reminder for application {}: {}", a.getId(), e.getMessage());
                }
            });
        }
    }
}
