
library(readxl)
library(dplyr)

setwd("/Users/mmauerman/Documents/Belize")

sheets <- excel_sheets("NMS Data UNTIL 2025.xlsx")

data_list <- list()

i <- 1
for(s in sheets) {
  
  data_header <- read_xlsx("NMS Data UNTIL 2025.xlsx",sheet=s,range="A2:B4",col_names = FALSE)
  
  data <- read_xlsx("NMS Data UNTIL 2025.xlsx",sheet=s,skip=8) %>%
    mutate(lat = as.numeric(data_header[2,2]),
           lon = as.numeric(data_header[3,2]),
           station = as.character(data_header[1,2])) %>%
    mutate_if(is.numeric,~ ifelse(.x==-99.9,NA,.x))
  
  data_list[[i]] <- data
  
  i <- i + 1
}

data_compiled <- bind_rows(data_list) %>% rename_at(c(1:9),~c("year","month","day","prec","tmax","tmin","lat","lon","station"))

write.csv(data_compiled,"belize_nms_stations.csv",row.names = FALSE)

