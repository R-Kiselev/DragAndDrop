.PHONY: build run rebuild down

# Empty by default, defines specific docker container to work with
CONT ?= 

# Builds container(s)
build:
	docker compose build $(CONT)

# Runs container(s)
run:
	docker compose up $(CONT)

# Delete, build and run container(s)
rebuild:  down build run

down:
	docker compose down $(CONT)
