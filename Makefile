.PHONY: up down logs restart clean test health

up:
	docker compose up -d
	@echo "Frontend: http://localhost:5173  Backend: http://localhost:5000/api"
down:
	docker compose down
logs:
	docker compose logs -f
restart: down up
clean:
	docker compose down -v
test:
	docker compose exec backend npm test
	docker compose exec frontend npm test
health:
	curl -fs http://localhost:5000/api/health
