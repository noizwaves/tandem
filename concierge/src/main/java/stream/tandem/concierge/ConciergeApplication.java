package stream.tandem.concierge;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ConciergeApplication {
    private static final Logger log = LoggerFactory.getLogger(ConciergeApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(ConciergeApplication.class, args);
    }
}
