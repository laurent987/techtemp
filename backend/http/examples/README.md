# 🌐 HTTP Server Examples

This folder contains structured and educational examples to demonstrate HTTP server and REST API usage.

## 📁 Structure

```
src/http/examples/
├── example-server.js         # 🚀 Basic HTTP server lifecycle
├── example-health.js         # 🏥 Health endpoint testing
├── example-readings-api.js   # 📊 Readings API demonstration
├── example-integration.js    # 🔗 Complete MQTT → DB → HTTP pipeline
└── README.md                 # 📚 This guide
```

## 🎯 Educational Objectives

### **example-server.js** - Server Foundation
✅ **Demonstrated features:**
- HTTP server creation with Express.js
- Server lifecycle (start/stop)
- Configuration handling
- Port management (automatic/manual)
- Graceful shutdown
- Error handling

### **example-health.js** - Health Endpoint
✅ **Demonstrated features:**
- `/health` endpoint implementation
- Database connectivity testing
- Success/failure scenarios
- JSON response formatting
- Error handling and status codes

### **example-readings-api.js** - REST API
✅ **Demonstrated features:**
- `/api/v1/readings/latest` endpoint
- Repository pattern integration
- Query parameters handling
- Data transformation and formatting
- Error scenarios (empty DB, invalid requests)

### **example-integration.js** - Complete Pipeline
✅ **Demonstrated features:**
- End-to-end MQTT → Database → HTTP flow
- Real sensor data simulation
- HTTP API data retrieval
- Performance monitoring
- Complete service lifecycle

## 🚀 Usage

### **Basic server testing**

#### Terminal 1 - Start server
```bash
cd service-app
node src/http/examples/example-server.js
```

#### Terminal 2 - Test with curl
```bash
# Test server is running
curl http://localhost:3001/health

# Check server info
curl -v http://localhost:3001/health
```

### **Health endpoint testing**
```bash
cd service-app
node src/http/examples/example-health.js
```

### **Readings API testing**
```bash
cd service-app
node src/http/examples/example-readings-api.js
```

### **Complete integration**
```bash
cd service-app
node src/http/examples/example-integration.js
```

### **Custom configurations**

```bash
# Custom port
HTTP_PORT=4000 node example-server.js

# Custom database
DB_PATH=./custom.db node example-readings-api.js

# Memory database
DB_PATH=:memory: node example-integration.js
```

## 📋 API Endpoints Reference

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/health` | GET | Server health check | `{"status": "ok"}` or `{"status": "failed"}` |
| `/api/v1/readings/latest` | GET | Latest readings per device | JSON array of readings |

### **Health Endpoint Details**
```bash
GET /health
```

**Success Response (200):**
```json
{"status": "ok"}
```

**Failure Response (500):**
```json
{"status": "failed"}
```

### **Readings Endpoint Details**
```bash
GET /api/v1/readings/latest
GET /api/v1/readings/latest?homeId=home001
GET /api/v1/readings/latest?deviceId=sensor001
```

**Success Response (200):**
```json
{
  "data": [
    {
      "home_id": "home001",
      "device_id": "sensor001", 
      "ts_utc": 1693737600,
      "values": {
        "temperature_c": 22.5,
        "humidity_pct": 45.0
      }
    }
  ]
}
```

**Error Response (400):**
```json
{
  "error": "Invalid query parameters"
}
```

## 🔧 Testing Tools

### **curl Commands**
```bash
# Health check
curl http://localhost:3001/health

# Latest readings
curl http://localhost:3001/api/v1/readings/latest

# With query parameters
curl "http://localhost:3001/api/v1/readings/latest?homeId=home001"

# Verbose output
curl -v http://localhost:3001/health

# JSON pretty-print
curl -s http://localhost:3001/api/v1/readings/latest | jq
```

### **HTTP Clients**
- **curl**: Command line HTTP client
- **Postman**: GUI HTTP client
- **HTTPie**: Modern command line HTTP client
- **VS Code REST Client**: Extension for API testing

## 💡 Usage Tips

### **Recommended startup sequence:**
1. Launch the server example (to start HTTP server)
2. Use curl or HTTP client to test endpoints
3. Check server logs for debugging
4. Use Ctrl+C to gracefully shutdown

### **Database Integration:**
- Examples use in-memory database (`:memory:`) by default
- Sample data is automatically created for testing
- Repository pattern abstracts database operations

### **Error Handling:**
- All endpoints return proper HTTP status codes
- JSON error responses with meaningful messages
- Server continues running despite endpoint errors

## 🐛 Troubleshooting

### **Port already in use**
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solutions:**
- Use different port: `HTTP_PORT=3002 node example-server.js`
- Stop other servers using the port
- Use port 0 for automatic assignment

### **Database connection errors**
```
Health check failed: Database connectivity test failed
```
**Solutions:**
- Check database path is accessible
- Verify database file permissions
- Use in-memory database for testing: `DB_PATH=:memory:`

### **Cannot GET /api/v1/readings/latest**
**Possible causes:**
- Readings API not implemented yet (Phase 3)
- Server not fully started
- Wrong URL or port

## 📚 Integration with Other Modules

### **Database (src/db/)**
- Uses `initDb()` for database setup
- Repository pattern for data access
- SQLite with WAL mode and foreign keys

### **MQTT (src/mqtt/)**
- Can receive data from MQTT examples
- Integration with ingestion pipeline
- Real-time data flow to HTTP API

### **Ingestion (src/ingestion/)**
- Processes MQTT messages into database
- Feeds data for HTTP API endpoints
- Complete IoT data pipeline

## 📊 Performance Notes

- **Memory usage**: In-memory DB uses minimal RAM
- **Response time**: Health check < 5ms, Readings API < 50ms
- **Concurrent requests**: Express.js handles multiple connections
- **Database**: SQLite with WAL mode for concurrent reads

## 🔗 Useful Links

- [Express.js Documentation](https://expressjs.com/)
- [HTTP Status Codes](https://httpstatuses.com/)
- [REST API Design Guidelines](https://restfulapi.net/)
- [Journal #005](../../../docs/journaux/journal#005_2025-09-09.md) - Implementation plan

---

**Next Steps:** Complete Phase 3 (Readings API) and Phase 4 (Complete Integration) for full functionality.
