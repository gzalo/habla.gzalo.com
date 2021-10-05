FROM php:7.2-apache

RUN mkdir /htk/
COPY --from=htk-docker:latest /root/htk/HTKTools/HCopy /htk/
COPY --from=htk-docker:latest /root/htk/HTKTools/HVite /htk/