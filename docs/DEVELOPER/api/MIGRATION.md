# 🔄 API Migration Guide

This guide helps developers migrate between TechTemp API versions, upgrade their integrations, and handle breaking changes.

## 📋 Current Version

**Latest Version**: `v1`  
**Base URL**: `http://localhost:3000/api/v1/`  
**Status**: ✅ Stable - Production ready

## 🗓️ Version History

### v1.0.0 (Current) - January 2025

**Initial stable release with:**
- Device management with UID-based public interface
- Room integration with auto-creation
- Readings API with pagination
- Comprehensive error handling
- Professional documentation

**Endpoints:**
- `GET|POST /api/v1/devices` - Device management
- `GET|PUT|DELETE /api/v1/devices/:uid` - Individual device operations
- `GET /api/v1/devices/:uid/readings` - Device readings with pagination
- `GET /health` - System health check

## 🚀 Future Roadmap

### v1.1.0 - Planned (Q2 2025)

**New Features (Backward Compatible):**
- Authentication system with API keys
- Real-time WebSocket endpoint for live data
- Device status and connectivity monitoring
- Bulk operations for device management

**New Endpoints:**
```http
# Authentication
POST /api/v1/auth/login
POST /api/v1/auth/refresh

# Real-time data
GET /api/v1/stream/devices/:uid/live  # WebSocket endpoint

# Device status
GET /api/v1/devices/:uid/status
GET /api/v1/devices/:uid/connectivity

# Bulk operations
POST /api/v1/devices/bulk/provision
PUT /api/v1/devices/bulk/update
DELETE /api/v1/devices/bulk/delete
```

### v1.2.0 - Planned (Q3 2025)

**Enhanced Features:**
- Advanced filtering and search
- Historical data aggregation
- Device configuration management
- Alert and notification system

**New Endpoints:**
```http
# Advanced queries
GET /api/v1/devices?search=kitchen&status=active&room=living-room
GET /api/v1/readings/aggregate?device=:uid&interval=1h&function=avg

# Device configuration
GET|PUT /api/v1/devices/:uid/config
POST /api/v1/devices/:uid/commands

# Alerts
GET|POST /api/v1/alerts
GET|PUT|DELETE /api/v1/alerts/:id
```

### v2.0.0 - Planned (2026)

**Breaking Changes:**
- New authentication requirements (API keys mandatory)
- Enhanced data models with metadata
- Deprecation of some v1 endpoints
- Database schema improvements

## 🔄 Migration Strategies

### Backward Compatibility Policy

**We guarantee:**
- ✅ **v1.x releases**: No breaking changes within major version
- ✅ **Endpoint stability**: Existing endpoints will continue working
- ✅ **Response format**: Existing fields will remain unchanged
- ✅ **6-month notice**: Breaking changes announced 6 months in advance

**We may add:**
- ✅ **New endpoints**: Additional functionality without affecting existing ones
- ✅ **New response fields**: Additional data in existing responses
- ✅ **New query parameters**: Optional parameters for enhanced functionality
- ✅ **New error codes**: More specific error handling

### Version Detection

**Check your current API version:**
```bash
curl -I http://localhost:3000/api/v1/devices
# Look for: X-API-Version: 1.0.0
```

**Programmatic version checking:**
```javascript
const response = await fetch('/api/v1/devices', { method: 'HEAD' });
const apiVersion = response.headers.get('X-API-Version');
console.log('Current API version:', apiVersion);
```

## 🛠️ Migration Tools

### Version Compatibility Checker

**Coming in v1.1.0** - Tool to validate your integration:

```bash
# Check compatibility with target version
npx techtemp-migration-tool check --target=v1.2.0

# Generate migration report
npx techtemp-migration-tool report --from=v1.0.0 --to=v1.2.0
```

### API Mock Service

For testing migrations:

```bash
# Run mock API with specific version
docker run -p 3001:3000 techtemp/api-mock:v1.2.0

# Test your client against future version
export TECHTEMP_API_URL=http://localhost:3001
npm test
```

## 📋 Migration Checklists

### v1.0.0 → v1.1.0 (Future)

**✅ No Breaking Changes** - This will be a minor version update

**Before Upgrading:**
- [ ] Review new authentication documentation
- [ ] Plan API key distribution strategy
- [ ] Test WebSocket client compatibility
- [ ] Update monitoring for new endpoints

**After Upgrading:**
- [ ] Verify existing endpoints still work
- [ ] Optionally implement new features
- [ ] Update client libraries if using authentication
- [ ] Monitor for new error patterns

**Code Changes Required:** None (optional new features only)

### v1.x → v2.0.0 (Future)

**⚠️ Breaking Changes Expected**

**Before Upgrading:**
- [ ] Audit current API usage
- [ ] Plan authentication implementation
- [ ] Review deprecated endpoint usage
- [ ] Prepare client code updates
- [ ] Set up testing environment

**Migration Steps:**
1. **Review Breaking Changes** (available 6 months before release)
2. **Update Authentication** - Implement API key handling
3. **Replace Deprecated Endpoints** - Use new equivalent endpoints
4. **Update Data Models** - Handle new response formats
5. **Test Thoroughly** - Validate all integrations
6. **Deploy Gradually** - Use feature flags and rollback plans

## 🔧 Client Library Migration

### JavaScript/Node.js Client

**Current (v1.0.0):**
```javascript
const TechTempClient = require('techtemp-client');
const client = new TechTempClient('http://localhost:3000');

// No authentication required
const devices = await client.getDevices();
```

**Future (v1.1.0) - Backward Compatible:**
```javascript
const TechTempClient = require('techtemp-client');
const client = new TechTempClient({
  baseUrl: 'http://localhost:3000',
  apiKey: 'your-api-key' // Optional in v1.1.0
});

// Same API, enhanced with optional features
const devices = await client.getDevices();
const liveData = await client.subscribeToDevice('aht20-f49c53');
```

**Future (v2.0.0) - Breaking Changes:**
```javascript
const TechTempClient = require('techtemp-client');
const client = new TechTempClient({
  baseUrl: 'http://localhost:3000',
  apiKey: 'your-api-key', // Required in v2.0.0
  version: 'v2'
});

// Enhanced response format
const devices = await client.getDevices(); // New fields in response
```

### Python Client

**Current (v1.0.0):**
```python
from techtemp_client import TechTempClient

client = TechTempClient('http://localhost:3000')
devices = client.get_devices()
```

**Future Migration:**
```python
from techtemp_client import TechTempClient

# v1.1.0 - Optional authentication
client = TechTempClient(
    base_url='http://localhost:3000',
    api_key='your-api-key'  # Optional
)

# v2.0.0 - Required authentication
client = TechTempClient(
    base_url='http://localhost:3000',
    api_key='your-api-key',  # Required
    version='v2'
)
```

## 📊 Monitoring Migration Impact

### Key Metrics to Monitor

**During Migration:**
- API response times
- Error rates by endpoint
- Client connection failures
- Authentication failures (v1.1.0+)

**Monitoring Setup:**
```bash
# Check API health during migration
curl http://localhost:3000/health

# Monitor error rates
curl http://localhost:3000/metrics | grep api_errors_total

# Check version distribution
curl http://localhost:3000/metrics | grep api_version_requests
```

### Migration Dashboards

**Grafana Dashboard Queries:**
```promql
# API version usage
sum by (version) (api_requests_total)

# Error rates by version
rate(api_errors_total[5m]) / rate(api_requests_total[5m])

# Response time comparison
histogram_quantile(0.95, api_request_duration_seconds)
```

## 🚨 Rollback Procedures

### Emergency Rollback

**If issues occur during migration:**

```bash
# Quick rollback to previous version
docker-compose down
docker-compose pull techtemp/service:v1.0.0
docker-compose up -d

# Verify rollback success
curl http://localhost:3000/health
```

### Database Rollback

**Schema migrations include rollback scripts:**
```sql
-- Rollback from v1.1.0 to v1.0.0
-- Remove new columns added in v1.1.0
ALTER TABLE devices DROP COLUMN api_key_id;
ALTER TABLE devices DROP COLUMN last_seen;

-- Rollback from v2.0.0 to v1.x.x
-- More complex rollback with data preservation
-- (Specific scripts provided with v2.0.0 release)
```

### Configuration Rollback

**Environment variables:**
```bash
# v1.0.0 configuration
TECHTEMP_API_VERSION=v1.0.0
TECHTEMP_AUTH_ENABLED=false

# v1.1.0 configuration
TECHTEMP_API_VERSION=v1.1.0
TECHTEMP_AUTH_ENABLED=true
TECHTEMP_AUTH_MODE=optional

# v2.0.0 configuration  
TECHTEMP_API_VERSION=v2.0.0
TECHTEMP_AUTH_ENABLED=true
TECHTEMP_AUTH_MODE=required
```

## 📋 Deprecation Notices

### Current Deprecations

**None** - All v1.0.0 endpoints are stable and supported.

### Future Deprecations (Advance Notice)

**v2.0.0 will deprecate:**
- Direct database ID exposure (will use UIDs exclusively)
- Unversioned API endpoints (will require explicit version)
- Anonymous access (will require API keys)

**Timeline:**
- **6 months before v2.0.0**: Deprecation warnings added
- **3 months before v2.0.0**: Migration tools available
- **v2.0.0 release**: Deprecated features removed

## 🔗 Version-Specific Documentation

### v1.0.0 Documentation (Current)
- [API Overview](README.md)
- [Device Endpoints](DEVICES.md)
- [Readings Endpoints](READINGS.md)
- [Error Handling](ERRORS.md)
- [Examples](EXAMPLES.md)

### v1.1.0 Documentation (Future)
- Authentication Guide *(coming soon)*
- WebSocket API Reference *(coming soon)*
- Real-time Integration Examples *(coming soon)*

### v2.0.0 Documentation (Future)
- Breaking Changes Guide *(coming soon)*
- Enhanced Data Models *(coming soon)*
- Migration Automation *(coming soon)*

## 💡 Best Practices

### Version-Agnostic Client Code

**Design for forward compatibility:**
```javascript
class TechTempClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.version = config.version || 'v1'; // Default to current
  }

  async getDevices() {
    const url = `${this.baseUrl}/api/${this.version}/devices`;
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add auth header if API key provided
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
}
```

### Graceful Migration Patterns

**Feature detection instead of version checking:**
```javascript
async function getDevicesWithFallback(client) {
  try {
    // Try new endpoint first
    return await client.getDevicesWithStatus();
  } catch (error) {
    if (error.status === 404) {
      // Fallback to basic endpoint
      return await client.getDevices();
    }
    throw error;
  }
}
```

### Environment-Based Configuration

**Use environment variables for version control:**
```bash
# Development - latest features
TECHTEMP_API_VERSION=v1.2.0

# Staging - stable features
TECHTEMP_API_VERSION=v1.1.0

# Production - proven stable
TECHTEMP_API_VERSION=v1.0.0
```

## 🆘 Migration Support

### Getting Help

1. **Review Documentation**: Check version-specific docs
2. **Test with Mock APIs**: Use our testing tools
3. **Join Migration Discussions**: GitHub Discussions
4. **Report Issues**: GitHub Issues with migration label
5. **Direct Support**: [migration-support@techtemp.io](mailto:migration-support@techtemp.io)

### Migration Assistance

**We provide:**
- ✅ **Migration guides** for each version
- ✅ **Testing tools** and mock APIs
- ✅ **Example code** for common patterns
- ✅ **Support channels** for questions
- ✅ **Emergency support** for critical issues

### Community Resources

- **Migration Examples**: [github.com/techtemp/migration-examples](https://github.com/techtemp/migration-examples)
- **Community Forum**: [forum.techtemp.io](https://forum.techtemp.io)
- **Video Tutorials**: [youtube.com/techtemp](https://youtube.com/techtemp)

---

## 🔄 Quick Reference

**Check Current Version:**
```bash
curl -I http://localhost:3000/api/v1/devices | grep X-API-Version
```

**Test Client Compatibility:**
```bash
# Test against current API
npm test

# Test against future mock API (when available)
TECHTEMP_API_URL=http://mock.techtemp.io/v1.1.0 npm test
```

**Monitor Migration:**
```bash
# Health check
curl http://localhost:3000/health

# Metrics
curl http://localhost:3000/metrics | grep api_version
```

Stay updated with our [API Changelog](../CHANGELOG.md) and [Release Notes](../releases/) for the latest migration information! 🚀
