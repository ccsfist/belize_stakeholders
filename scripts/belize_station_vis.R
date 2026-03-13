
library(dplyr)
library(ggplot2)

setwd("/Users/mmauerman/Documents/Belize")

stations <- read.csv("belize_nms_stations.csv")
dekads <- read.csv("daily_vector_dekads.csv") %>% rename_at(c(1:2),~c("time","dekad")) %>% mutate(time = as.Date(paste0("2000-",time),format="%Y-%d-%b")) %>%
  mutate(month = as.numeric(format(time,"%m")),day=as.numeric(format(time,"%d"))) %>% dplyr::select(-time)

## clean data

stations <- stations %>% mutate(ag_year = ifelse(month==1,year-1,year)) %>% left_join(dekads,by=c("month"="month","day"="day")) %>%
  group_by(station,year,dekad) %>% mutate(rain_dek = sum(prec,na.rm=T)) %>% ungroup()

## plot on map

stations_map <- stations %>% group_by(station) %>% mutate(n = c(1:n())) %>% filter(n ==1 ) %>% ungroup()
write.csv(stations_map,"stations_map.csv",row.names = FALSE)

## climatology

clim <- stations %>% group_by(station,dekad) %>% summarise(prec_clim = mean(rain_dek,na.rm=T),day=max(day),month=max(month)) %>%
  mutate(date = as.Date(paste("2000",month,day,sep="-")))

ggplot(clim,aes(x=date,y=prec_clim)) + geom_line() + facet_wrap(~station)

## wettest and driest years

season_totals <- stations %>% filter(month %in% c(1,5:12)) %>% group_by(station,ag_year) %>% summarise(rain_tot=sum(prec))

ggplot(season_totals,aes(x=ag_year,y=rain_tot)) + geom_point() + facet_wrap(~station)

ggplot(season_totals %>% filter(ag_year %in% c(2000:2022)),aes(x=ag_year,y=rain_tot)) + geom_point() + facet_wrap(~station)